import { NextResponse } from 'next/server'
import { getNftReplacement, listNftReplacements, markReplacementMinted } from '@/lib/nft-replacements'
import { accountOwnsNft, getXrplConfig, mintCardNft, withXrplClient } from '@/lib/xrpl-server'
import { CYBORG_COWBOY_NFT_TAXON, CYBORG_COWBOY_POOL, validateCyborgMetadataBaseUrl } from '@/lib/cyborg-cowboy'
import { CHROMATIC_ABYSS_POOL } from '@/lib/chromatic-abyss'
import { CARD_POOL, getDisplayCardName, RIPPLEBORN_METADATA_BASE_URL } from '@/lib/rippleborn'
import { listOpenClaimOffers, reconcileOpenClaimOffers } from '@/lib/nft-claim-lifecycle'
import { getPackResult } from '@/lib/pack-results'

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/
const HEX_256 = /^[A-Fa-f0-9]{64}$/

const CARD_ART = new Map(
  [CARD_POOL, CYBORG_COWBOY_POOL, CHROMATIC_ABYSS_POOL]
    .flatMap((pool) => Object.values(pool).flat())
    .map((card) => [card.name.toLowerCase(), { name: getDisplayCardName(card.name), image: card.image }] as const),
)

function resolveOfferCard(
  offer: { nftId: string; offerId: string },
  result: Awaited<ReturnType<typeof getPackResult>>,
) {
  if (!result) return null

  const mintIndex = result.mintResults?.findIndex(
    (candidate) =>
      candidate.nftId?.toUpperCase() === offer.nftId.toUpperCase() ||
      candidate.offerId?.toUpperCase() === offer.offerId.toUpperCase(),
  ) ?? -1
  const mintedCard = mintIndex >= 0 ? result.mintResults?.[mintIndex] : undefined
  const savedCard =
    result.cards.find((candidate) => candidate.id === mintedCard?.id) ??
    result.cards.find((candidate) => candidate.name === mintedCard?.name) ??
    (mintIndex >= 0 ? result.cards[mintIndex] : undefined)
  const card = mintedCard ?? savedCard
  if (!card) return null

  const catalogCard = CARD_ART.get(card.name.toLowerCase())
  return {
    name: getDisplayCardName(card.name || catalogCard?.name || 'Minted NFT awaiting claim'),
    image: card.image || savedCard?.image || catalogCard?.image || null,
  }
}

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get('owner')?.trim()
  if (!owner || !XRPL_ADDRESS.test(owner)) {
    return NextResponse.json({ error: 'A valid Xaman wallet address is required.' }, { status: 400 })
  }

  const [replacements, storedClaimOffers] = await Promise.all([
    listNftReplacements(owner),
    listOpenClaimOffers(owner),
  ])
  const claimOffers = await reconcileOpenClaimOffers(storedClaimOffers)
  const packResults = new Map(
    await Promise.all(
      [...new Set(claimOffers.map((offer) => offer.orderId))].map(async (orderId) => [
        orderId,
        await getPackResult(orderId),
      ] as const),
    ),
  )

  return NextResponse.json({
    replacements,
    claimOffers: claimOffers.map((offer) => {
      const card = resolveOfferCard(offer, packResults.get(offer.orderId) ?? null)

      return {
        nftId: offer.nftId,
        offerId: offer.offerId,
        mintedAt: offer.mintedAt.toISOString(),
        claimExpiresAt: offer.claimExpiresAt.toISOString(),
        name: card?.name ?? 'Minted NFT awaiting claim',
        image: card?.image ?? null,
      }
    }),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { owner?: unknown; originalNftId?: unknown }
    const owner = typeof body.owner === 'string' ? body.owner.trim() : ''
    const originalNftId = typeof body.originalNftId === 'string' ? body.originalNftId.trim().toUpperCase() : ''
    if (!XRPL_ADDRESS.test(owner) || !HEX_256.test(originalNftId)) {
      return NextResponse.json({ error: 'A valid wallet and NFT ID are required.' }, { status: 400 })
    }

    const record = await getNftReplacement(originalNftId, owner)
    if (!record) return NextResponse.json({ error: 'This NFT is not eligible for recovery.' }, { status: 404 })
    if (record.replacementNftId && record.replacementOfferId) {
      return NextResponse.json({ replacement: record })
    }

    const isCyborg = record.originalUri.includes('/metadata/') || record.originalUri.includes('bafybeib3whzmhi5ejq6nuljfjihocx4edutgrkbp4rgptohc2jv6zz5wg4')
    const metadataUri = isCyborg
      ? `${validateCyborgMetadataBaseUrl(process.env.CYBORG_COWBOY_METADATA_BASE_URL)}/${record.cardId}.json`
      : `${RIPPLEBORN_METADATA_BASE_URL}/${record.cardId}.json`
    const config = getXrplConfig()
    const replacement = await withXrplClient(config.websocketUrl, async (client) => {
      const ownsOriginal = await accountOwnsNft(client, owner, originalNftId, record.originalUri)
      if (!ownsOriginal) throw new Error('The connected wallet no longer owns the eligible original NFT.')
      return mintCardNft(
        client,
        config,
        owner,
        metadataUri,
        isCyborg ? CYBORG_COWBOY_NFT_TAXON : config.nftTaxon,
      )
    })

    const updated = await markReplacementMinted(originalNftId, owner, replacement)
    if (!updated) {
      const current = await getNftReplacement(originalNftId, owner)
      return NextResponse.json({ replacement: current })
    }

    return NextResponse.json({ replacement: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare replacement NFT.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
