import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import type { Client, TransactionMetadata } from 'xrpl'
import {
  CHROMATIC_ABYSS_METADATA_BASE_URL,
  CHROMATIC_ABYSS_NFT_TAXON,
  CHROMATIC_ABYSS_POOL,
  rollChromaticAbyssCard,
} from '@/lib/chromatic-abyss'
import {
  CYBORG_COWBOY_NFT_TAXON,
  CYBORG_COWBOY_POOL,
  rollCyborgCowboyCard,
  validateCyborgMetadataBaseUrl,
} from '@/lib/cyborg-cowboy'
import {
  CARD_POOL,
  isPackSetId,
  rollPack,
  rollRarity,
  SLOT_ODDS,
} from '@/lib/rippleborn'
import {
  commitPackResult,
  getPackResult,
  markPackFailed,
  saveMintResults,
  type MintedPackCard,
} from '@/lib/pack-results'
import {
  markCollectionPhoenixMinted,
  releasePhoenixSlot,
  reservePhoenixSlot,
} from '@/lib/phoenix-supply'
import { getClaimTtlHours, registerClaimOffers } from '@/lib/nft-claim-lifecycle'
import { cleanupUnclaimedOffer } from '@/lib/workflows/cleanup-unclaimed-offer'
import {
  getPhoenixReservation,
  markPhoenixFailed,
  markPhoenixMinted,
} from '@/lib/phoenix-editions'
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

type AccountTransaction = {
  validated?: boolean
  hash?: string
  meta?: TransactionMetadata | string
  tx?: Record<string, unknown>
  tx_json?: Record<string, unknown>
}

async function validateCardMetadata(card: { name: string; uri?: string; limited?: boolean }): Promise<string | null> {
  if (!encodeMetadataUri(card.uri)) return 'No valid HTTPS Pinata metadata URL is configured for this card.'
  if (card.limited) return null

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
      if (existingResult?.mintResults) {
        return NextResponse.json({
          orderId: destinationTag,
          buyer,
          status: 'fulfilled',
          paymentVerified: true,
          paymentTransaction,
          commitment: existingResult.commitment,
          cards: existingResult.mintResults,
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
      cards = SLOT_ODDS.map(({ slot }) =>
        rollCyborgCowboyCard(rollRarity(slot), slot, cyborgMetadataBaseUrl),
      )
    } else if (setId === 'chromatic-abyss') {
      metadataBaseUrl = CHROMATIC_ABYSS_METADATA_BASE_URL
      cards = SLOT_ODDS.map(({ slot }) =>
        rollChromaticAbyssCard(rollRarity(slot), slot),
      )
    } else {
      cards = rollPack()
    }

    const phoenixIndex = cards.findIndex((card) => card.name === 'The Phoenix')
    if (phoenixIndex >= 0 && !(await reservePhoenixSlot(setId, destinationTag))) {
      const phoenixCard = cards[phoenixIndex]
      if (setId === 'cyborg-cowboy' && metadataBaseUrl) {
        let replacement = rollCyborgCowboyCard('Mythic', phoenixCard.slot, metadataBaseUrl)
        while (replacement.name === 'The Phoenix') {
          replacement = rollCyborgCowboyCard('Mythic', phoenixCard.slot, metadataBaseUrl)
        }
        cards[phoenixIndex] = replacement
      } else if (setId === 'chromatic-abyss') {
        let replacement = rollChromaticAbyssCard('Mythic', phoenixCard.slot)
        while (replacement.name === 'The Phoenix') {
          replacement = rollChromaticAbyssCard('Mythic', phoenixCard.slot)
        }
        cards[phoenixIndex] = replacement
      } else {
        const alternatives = CARD_POOL.Mythic.filter((card) => card.name !== 'The Phoenix')
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)]
        cards[phoenixIndex] = {
          id: `${phoenixCard.slot}-${Math.random().toString(36).slice(2, 10)}`,
          ...replacement,
          rarity: 'Mythic',
          slot: phoenixCard.slot,
        }
      }
    }
  } else if (cards.some((card) => card.name === 'The Phoenix')) {
    const reserved = await reservePhoenixSlot(setId, destinationTag)
    if (!reserved) throw new Error('The Phoenix supply for this collection has already been allocated.')
  }

      const committed = await commitPackResult({
        orderId: destinationTag,
        buyer,
        paymentTxHash: paymentTransaction,
        cards,
      })
      cards = committed.cards

      const phoenixReservation = await getPhoenixReservation(destinationTag)
      const fulfilledCards: MintedPackCard[] = []

      for (const card of cards) {
        if (
          card.limited &&
          phoenixReservation?.status === 'minted' &&
          phoenixReservation.nftId &&
          phoenixReservation.offerId
        ) {
          fulfilledCards.push({
            ...card,
            mintStatus: 'minted',
            nftId: phoenixReservation.nftId,
            offerId: phoenixReservation.offerId,
            ...claimWindow(),
          })
          continue
        }
        const currentUri = card.limited
          ? card.uri
          : setId === 'cyborg-cowboy'
            ? (() => {
                const currentCard = Object.values(CYBORG_COWBOY_POOL)
                  .flat()
                  .find((candidate) => candidate.name === card.name)
                return currentCard
                  ? currentCard.uri ?? `${validateCyborgMetadataBaseUrl(process.env.CYBORG_COWBOY_METADATA_BASE_URL)}/${currentCard.slug}.json`
                  : card.uri
              })()
            : setId === 'chromatic-abyss'
              ? Object.values(CHROMATIC_ABYSS_POOL)
                  .flat()
                  .find((candidate) => candidate.name === card.name)?.uri ?? card.uri
              : Object.values(CARD_POOL)
                  .flat()
                  .find((candidate) => candidate.name === card.name)?.uri ?? card.uri
        const cardToMint = { ...card, uri: currentUri }
        const metadataError = await validateCardMetadata(cardToMint)
        if (metadataError) {
          if (card.name === 'The Phoenix') {
            await releasePhoenixSlot(destinationTag)
          }
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
          if (card.limited) {
            await markPhoenixMinted(destinationTag, minted.nftId, minted.offerId)
          }
          if (card.name === 'The Phoenix') {
            await markCollectionPhoenixMinted(destinationTag, minted.nftId, minted.offerId)
          }
          fulfilledCards.push({
            ...cardToMint,
            ...minted,
            ...claimWindow(),
            mintStatus: 'minted',
          })
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'XRPL minting failed.'
          if (card.limited) {
            await markPhoenixFailed(destinationTag, reason)
          }
          if (card.name === 'The Phoenix') {
            await releasePhoenixSlot(destinationTag)
          }
          fulfilledCards.push({ ...card, mintStatus: 'failed', reason })
        }
      }

      await saveMintResults(destinationTag, fulfilledCards)

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
        cards: fulfilledCards,
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
