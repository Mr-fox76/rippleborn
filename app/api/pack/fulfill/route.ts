import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import type { Client, TransactionMetadata } from 'xrpl'
import { createPhoenixCard, rollPack } from '@/lib/rippleborn'
import {
  commitPackResult,
  getPackResult,
  markPackFailed,
  saveMintResults,
  type MintedPackCard,
} from '@/lib/pack-results'
import {
  getPhoenixReservation,
  markPhoenixFailed,
  markPhoenixMinted,
  PHOENIX_DROP_CHANCE,
  phoenixMetadataReady,
  reservePhoenixEdition,
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
  if (!encodeMetadataUri(card.uri)) return 'No valid public HTTPS metadata URL is configured for this card.'
  if (card.limited) return null

  const filename = card.uri?.match(/\/([a-z0-9][a-z0-9._-]*\.json)$/i)?.[1]
  if (!filename) return 'The card metadata URL must reference a JSON file in the pinned folder.'

  try {
    const raw = await readFile(path.join(process.cwd(), 'public', 'cards', filename), 'utf8')
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

    return verifyPaymentTransaction(
      result,
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
  let body: { orderId?: unknown; buyer?: unknown; transactionHash?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const destinationTag = parseDestinationTag(body.orderId)
  const buyer = validateBuyer(body.buyer)
  const transactionHash =
    typeof body.transactionHash === 'string' && /^[A-F0-9]{64}$/i.test(body.transactionHash)
      ? body.transactionHash.toUpperCase()
      : null

  if (body.transactionHash !== undefined && !transactionHash) {
    return NextResponse.json({ error: 'A valid XRPL transaction hash is required.' }, { status: 400 })
  }
  if (destinationTag === null) {
    return NextResponse.json({ error: 'A valid numeric pack order ID is required.' }, { status: 400 })
  }
  if (!buyer) {
    return NextResponse.json({ error: 'A valid XRPL classic address is required.' }, { status: 400 })
  }

  try {
    const config = getXrplConfig()

    return await withXrplClient(config.websocketUrl, async (client) => {
      const paymentTransaction = transactionHash
        ? await verifyPaymentByHash(client, transactionHash, config, buyer, destinationTag)
        : await findPayment(client, config, buyer, destinationTag)
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
        cards = rollPack()
        const existingPhoenix = await getPhoenixReservation(destinationTag)
        const phoenixReservation =
          existingPhoenix ??
          (phoenixMetadataReady() && Math.random() < PHOENIX_DROP_CHANCE
            ? await reservePhoenixEdition(destinationTag, buyer)
            : null)

        if (phoenixReservation) {
          cards[2] = createPhoenixCard(phoenixReservation.edition, phoenixReservation.metadataUri)
        }
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
          })
          continue
        }
        const metadataError = await validateCardMetadata(card)
        if (metadataError) {
          console.error(`[v0] Skipping ${card.name}: ${metadataError}`)
          fulfilledCards.push({ ...card, mintStatus: 'skipped', reason: metadataError })
          continue
        }

        try {
          const minted = await mintCardNft(client, config, buyer, card.uri as string)
          if (card.limited) {
            await markPhoenixMinted(destinationTag, minted.nftId, minted.offerId)
          }
          fulfilledCards.push({ ...card, ...minted, mintStatus: 'minted' })
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'XRPL minting failed.'
          if (card.limited) {
            await markPhoenixFailed(destinationTag, reason)
          }
          fulfilledCards.push({ ...card, mintStatus: 'failed', reason })
        }
      }

      await saveMintResults(destinationTag, fulfilledCards)

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
