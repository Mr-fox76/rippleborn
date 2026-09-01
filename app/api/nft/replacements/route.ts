import { NextResponse } from 'next/server'
import { getNftReplacement, listNftReplacements, markReplacementMinted } from '@/lib/nft-replacements'
import { accountOwnsNft, getXrplConfig, mintCardNft, withXrplClient } from '@/lib/xrpl-server'
import { CYBORG_COWBOY_NFT_TAXON, validateCyborgMetadataBaseUrl } from '@/lib/cyborg-cowboy'
import { RIPPLEBORN_METADATA_BASE_URL } from '@/lib/rippleborn'
import { listOpenClaimOffers } from '@/lib/nft-claim-lifecycle'

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/
const HEX_256 = /^[A-Fa-f0-9]{64}$/

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get('owner')?.trim()
  if (!owner || !XRPL_ADDRESS.test(owner)) {
    return NextResponse.json({ error: 'A valid Xaman wallet address is required.' }, { status: 400 })
  }

  const [replacements, claimOffers] = await Promise.all([
    listNftReplacements(owner),
    listOpenClaimOffers(owner),
  ])
  return NextResponse.json({
    replacements,
    claimOffers: claimOffers.map((offer) => ({
      nftId: offer.nftId,
      offerId: offer.offerId,
      mintedAt: offer.mintedAt.toISOString(),
      claimExpiresAt: offer.claimExpiresAt.toISOString(),
    })),
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
