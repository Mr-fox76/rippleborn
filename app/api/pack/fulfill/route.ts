import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import type { Client, TransactionMetadata } from 'xrpl'
import { addDiscoveryNumbers } from '@/lib/card-discoveries'
import {
  CHROMATIC_ABYSS_METADATA_BASE_URL,
  CHROMATIC_ABYSS_NFT_TAXON,
  CHROMATIC_ABYSS_POOL,
  rollChromaticAbyssCard,
} from '@/lib/chromatic-abyss'
import {
  CYBORG_COWBOY_METADATA_BASE_URL,
  CYBORG_COWBOY_NFT_TAXON,
  CYBORG_COWBOY_POOL,
  rollCyborgCowboyCard,
  validateCyborgMetadataBaseUrl,
} from '@/lib/cyborg-cowboy'
import {
  CARD_POOL,
  PACK_SLOTS,
  isPackSetId,
  rollPack,
  rollRarity,
  type Card,
} from '@/lib/rippleborn'
import {
  commitPackResult,
  getPackResult,
  markPackFailed,
  saveMintResults,
  type MintedPackCard,
} from '@/lib/pack-results'
import { getClaimTtlHours, registerClaimOffers } from '@/lib/nft-claim-lifecycle'
import { cleanupUnclaimedOffer } from '@/lib/workflows/cleanup-unclaimed-offer'
import {
  encodeMetadataUri,
  getXrplConfig,
  mintCardNft,
  parseDestinationTag,
  validateBuyer,
  withXrplClient,
  type XrplConfig,
} from '@/lib/xrpl-server'

export const runtime = 'nodejs'

function rollUniquePack(createCard: (slot: number) => Card): Card[] {
  const cards: Card[] = []
  const selectedNames = new Set<string>()

  for (const slot of PACK_SLOTS) {
    let card: Card | undefined
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = createCard(slot)
      if (selectedNames.has(candidate.name)) continue
      card = candidate
      break
    }
    if (!card) throw new Error('Unable to create a pack with three unique cards.')
    selectedNames.add(card.name)
    cards.push(card)
  }

  return cards
}

type AccountTransaction = {
  validated?: boolean
  hash?: string
  meta?: TransactionMetadata | string
  tx?: Record<string, unknown>
  tx_json?: Record<string, unknown>
}

async function validateCardMetadata(card: { name: string; uri?: string; limited?: boolean }): Promise<string | null> {
  if (!encodeMetadataUri(card.uri)) return 'No valid HTTPS Pinata metadata URL is configured for this card.'
  if (card.name === 'The Phoenix') return null

  const filename = card.uri?.match(/\/([a-z0-9][a-z0-9._-]*\.json)$/i)?.[1]
  if (!filename) return 'The card metadata URL must reference a JSON file in the pinned folder.'
  const isChromaticAbyss = card.uri?.includes(
    'bafybeid74vziobs6hygeknebvm5endcfhhlp4z25cqww3qtjg42if55o74/metadata/',
  )
  const metadataFolder = isChromaticAbyss
    ? path.join(process.cwd(), 'public', 'sets', 'chromatic-abyss', 'json')
    : card.uri?.includes('/sets/cyborg-cowboy/json/') || card.uri?.includes('/metadata/')
      ? path.join(process.cwd(), 'public', 'sets', 'cyborg-cowboy', 'json')
      : path.join(process.cwd(), 'public', 'cards')

  try {
    const raw = await readFile(path.join(metadataFolder, filename), 'utf8')
    const metadata = JSON.parse(raw) as Record<string, unknown>
    if (metadata.name !== card.name) return 'The metadata name does not match the selected card.'
    if (typeof metadata.description !== 'string' || !metadata.description.trim()) {
      return 'The metadata description is missing.'
    }
    if (typeof metadata.image !== 'string' || !metadata.image.trim()) return 'The metadata image is missing.'
    if (!Array.isArray(metadata.attributes)) return 'The metadata attributes are missing.'
    return null
  } catch {
    return `Metadata file ${filename} is missing or invalid.`
  }
}

function getTransactionResult(meta: unknown): string | null {
  if (typeof meta !== 'object' || meta === null) return null
  const result = (meta as { TransactionResult?: unknown }).TransactionResult
  return typeof result === 'string' ? result : null
}

function claimWindow() {
  const mintedAt = new Date()
  const claimExpiresAt = new Date(mintedAt.getTime() + getClaimTtlHours() * 60 * 60 * 1000)
  return { mintedAt: mintedAt.toISOString(), claimExpiresAt: claimExpiresAt.toISOString() }
}

function verifyPaymentTransaction(
  transaction: Record<string, unknown>,
  meta: unknown,
  validated: boolean,
  config: XrplConfig,
  buyer: string,
  destinationTag: number,
): boolean {
  const requestedAmount = transaction.Amount ?? transaction.DeliverMax

  return (
    validated &&
    getTransactionResult(meta) === 'tesSUCCESS' &&
    transaction.TransactionType === 'Payment' &&
    transaction.Account === buyer &&
    transaction.Destination === config.treasuryAddress &&
    requestedAmount === config.packPriceDrops &&
    transaction.DestinationTag === destinationTag
  )
}

async function verifyPaymentByHash(
  client: Client,
  transactionHash: string,
  config: XrplConfig,
  buyer: string,
  destinationTag: number,
): Promise<string | null> {
  try {
    const response = await client.request({ command: 'tx', transaction: transactionHash })
    const result = response.result as unknown as Record<string, unknown>
    const transaction =
      typeof result.tx_json === 'object' && result.tx_json !== null
        ? (result.tx_json as Record<string, unknown>)
        : result

    return verifyPaymentTransaction(
      transaction,
      result.meta,
      result.validated === true,
      config,
      buyer,
      destinationTag,
    )
      ? transactionHash
      : null
  } catch {
    return null
  }
}

async function findPayment(
  client: Client,
  config: XrplConfig,
  buyer: string,
  destinationTag: number,
): Promise<string | null> {
  let marker: unknown

  do {
    const response = await client.request({
      command: 'account_tx',
      account: config.treasuryAddress,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward: false,
      limit: 200,
      ...(marker ? { marker } : {}),
    })

    for (const entry of response.result.transactions as AccountTransaction[]) {
      const transaction = entry.tx_json ?? entry.tx ?? {}
      const meta = entry.meta
      const transactionHash =
        typeof entry.hash === 'string'
          ? entry.hash
          : typeof transaction.hash === 'string'
            ? transaction.hash
            : null

      if (
        verifyPaymentTransaction(
          transaction,
          meta,
          entry.validated === true,
          config,
          buyer,
          destinationTag,
        )
      ) {
        if (!transactionHash) {
          throw new Error('Validated payment did not include a transaction hash.')
        }
        return transactionHash
      }
    }

    marker = response.result.marker
  } while (marker)

  return null
}

export async function POST(request: Request) {
  let body: { orderId?: unknown; buyer?: unknown; setId?: unknown; transactionHash?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const destinationTag = parseDestinationTag(body.orderId)
  const buyer = validateBuyer(body.buyer)
  const setId = body.setId ?? 'ledgerborn'
  if (!isPackSetId(setId)) {
    return NextResponse.json({ error: 'A valid card set is required.' }, { status: 400 })
  }
  const transactionHash =
    typeof body.transactionHash === 'string' && /^[A-F0-9]{64}$/i.test(body.transactionHash)
      ? body.transactionHash.toUpperCase()
      : null

  if (body.transactionHash !== undefined && !transactionHash) {
    return NextResponse.json({ error: 'A valid XRPL transaction hash is required.' }, { status: 400 })
  }
  if (destinationTag === null) {
    return NextResponse.json({ error: 'A valid destination tag is required.' }, { status: 400 })
  }
  const expectedRemainder = setId === 'ledgerborn' ? 0 : setId === 'cyborg-cowboy' ? 1 : 2
  if (destinationTag % 3 !== expectedRemainder) {
    return NextResponse.json({ error: 'The selected card set does not match this pack order.' }, { status: 400 })
  }
  if (!buyer) {
    return NextResponse.json({ error: 'A valid XRPL classic address is required.' }, { status: 400 })
  }

  try {
    const config = getXrplConfig()

    return await withXrplClient(config.websocketUrl, async (client) => {
      let paymentTransaction: string | null = null

      if (transactionHash) {
        for (let attempt = 0; attempt < 5 && !paymentTransaction; attempt += 1) {
          paymentTransaction = await verifyPaymentByHash(
            client,
            transactionHash,
            config,
            buyer,
            destinationTag,
          )
          if (!paymentTransaction && attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 800))
          }
        }
      }

      paymentTransaction ??= await findPayment(client, config, buyer, destinationTag)
      if (!paymentTransaction) {
        return NextResponse.json(
          {
            error: `A matching payment was not found. The payment must be sent from ${buyer} to the displayed treasury for exactly ${config.packPriceDrops} drops with destination tag ${destinationTag}.`,
          },
          { status: 402 },
        )
      }

      const existingResult = await getPackResult(destinationTag)
      const existingMintResults = existingResult?.mintResults
      if (
        existingMintResults?.length &&
        existingMintResults.every(
          (card) => card.mintStatus === 'minted' && card.nftId && card.offerId,
        )
      ) {
        return NextResponse.json({
          orderId: destinationTag,
          buyer,
          status: 'fulfilled',
          paymentVerified: true,
          paymentTransaction,
          commitment: existingResult?.commitment ?? null,
          cards: existingMintResults,
        })
      }

  let cards = existingResult?.cards
  if (!cards) {
    let metadataBaseUrl: string | undefined
    if (setId === 'cyborg-cowboy') {
      metadataBaseUrl = validateCyborgMetadataBaseUrl(
        process.env.CYBORG_COWBOY_METADATA_BASE_URL,
      )
      if (!metadataBaseUrl) {
        return NextResponse.json(
          { error: 'The Cyborg Cowboy metadata URL must use the corrected immutable IPFS bundle.' },
          { status: 503 },
        )
      }
      const cyborgMetadataBaseUrl = metadataBaseUrl
      cards = rollUniquePack((slot) =>
        rollCyborgCowboyCard(rollRarity(), slot, cyborgMetadataBaseUrl),
      )
    } else if (setId === 'chromatic-abyss') {
      metadataBaseUrl = CHROMATIC_ABYSS_METADATA_BASE_URL
      cards = rollUniquePack((slot) =>
        rollChromaticAbyssCard(rollRarity(), slot),
      )
    } else {
      cards = rollPack()
    }
  }

      const committed = await commitPackResult({
        orderId: destinationTag,
        buyer,
        paymentTxHash: paymentTransaction,
        cards,
      })
      cards = committed.cards

      const fulfilledCards: MintedPackCard[] = []

      for (const [cardIndex, card] of cards.entries()) {
        const previousMint = existingMintResults?.[cardIndex]
        if (
          previousMint?.mintStatus === 'minted' &&
          previousMint.nftId &&
          previousMint.offerId
        ) {
          fulfilledCards.push(previousMint)
          continue
        }

        const currentUri = setId === 'cyborg-cowboy'
          ? (() => {
                const currentCard = Object.values(CYBORG_COWBOY_POOL)
                  .flat()
                  .find((candidate) => candidate.name === card.name)
                return currentCard
                  ? `${CYBORG_COWBOY_METADATA_BASE_URL}/${currentCard.slug}.json`
                  : card.uri
              })()
            : setId === 'chromatic-abyss'
              ? (() => {
                  const currentCard = Object.values(CHROMATIC_ABYSS_POOL)
                    .flat()
                    .find((candidate) => candidate.name === card.name)
                  return currentCard
                    ? `${CHROMATIC_ABYSS_METADATA_BASE_URL}/${currentCard.slug}.json`
                    : card.uri
                })()
              : Object.values(CARD_POOL)
                  .flat()
                  .find((candidate) => candidate.name === card.name)?.uri ?? card.uri
        const cardToMint = { ...card, uri: currentUri }
        const metadataError = await validateCardMetadata(cardToMint)
        if (metadataError) {
          fulfilledCards.push({ ...cardToMint, mintStatus: 'skipped', reason: metadataError })
          continue
        }

        try {
          const minted = await mintCardNft(
            client,
            config,
            buyer,
            cardToMint.uri as string,
            setId === 'cyborg-cowboy'
              ? CYBORG_COWBOY_NFT_TAXON
              : setId === 'chromatic-abyss'
                ? CHROMATIC_ABYSS_NFT_TAXON
                : config.nftTaxon,
          )
          fulfilledCards.push({
            ...cardToMint,
            ...minted,
            ...claimWindow(),
            mintStatus: 'minted',
          })
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'XRPL minting failed.'
          fulfilledCards.push({ ...cardToMint, mintStatus: 'failed', reason })
        }
      }

      await saveMintResults(destinationTag, fulfilledCards)
      const numberedCards = await addDiscoveryNumbers(fulfilledCards)

      const claimOffers = fulfilledCards.flatMap((card) =>
        card.mintStatus === 'minted' &&
        card.nftId &&
        card.offerId &&
        card.mintedAt &&
        card.claimExpiresAt
          ? [{
              nftId: card.nftId,
              offerId: card.offerId,
              mintedAt: card.mintedAt,
              claimExpiresAt: card.claimExpiresAt,
            }]
          : [],
      )
      await registerClaimOffers({ orderId: destinationTag, buyer, offers: claimOffers })
      await Promise.all(
        claimOffers.map(async ({ offerId, claimExpiresAt }) => {
          try {
            await start(cleanupUnclaimedOffer, [{ offerId, claimExpiresAt }])
          } catch {
            // Cleanup scheduling failure is non-fatal and intentionally not logged with raw context.
          }
        }),
      )

      return NextResponse.json({
        orderId: destinationTag,
        buyer,
        status: 'fulfilled',
        paymentVerified: true,
        paymentTransaction,
        commitment: committed.commitment,
        cards: numberedCards,
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'XRPL fulfillment failed.'
    if (destinationTag !== null) {
      await markPackFailed(destinationTag, message).catch(() => undefined)
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
