import { NextResponse } from 'next/server'
import type { Client, TransactionMetadata } from 'xrpl'
import { rollPack, type Card } from '@/lib/rippleborn'
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

type FulfilledCard = Card & {
  mintStatus: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  reason?: string
}

type AccountTransaction = {
  validated?: boolean
  meta?: TransactionMetadata | string
  tx?: Record<string, unknown>
  tx_json?: Record<string, unknown>
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
      const successful =
        typeof meta === 'object' && meta !== null && meta.TransactionResult === 'tesSUCCESS'

      if (
        entry.validated === true &&
        successful &&
        transaction.TransactionType === 'Payment' &&
        transaction.Account === buyer &&
        transaction.Destination === config.treasuryAddress &&
        transaction.Amount === config.packPriceDrops &&
        transaction.DestinationTag === destinationTag
      ) {
        return typeof transaction.hash === 'string' ? transaction.hash : 'validated-payment'
      }
    }

    marker = response.result.marker
  } while (marker)

  return null
}

export async function POST(request: Request) {
  let body: { orderId?: unknown; buyer?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const destinationTag = parseDestinationTag(body.orderId)
  const buyer = validateBuyer(body.buyer)

  if (destinationTag === null) {
    return NextResponse.json({ error: 'A valid numeric pack order ID is required.' }, { status: 400 })
  }
  if (!buyer) {
    return NextResponse.json({ error: 'A valid XRPL classic address is required.' }, { status: 400 })
  }

  try {
    const config = getXrplConfig()

    return await withXrplClient(config.websocketUrl, async (client) => {
      const paymentTransaction = await findPayment(client, config, buyer, destinationTag)
      if (!paymentTransaction) {
        return NextResponse.json(
          {
            error: `No validated ${config.packPriceDrops}-drop payment was found for destination tag ${destinationTag}.`,
          },
          { status: 402 },
        )
      }

      const cards = rollPack()
      const fulfilledCards: FulfilledCard[] = []

      for (const card of cards) {
        if (!encodeMetadataUri(card.uri)) {
          fulfilledCards.push({
            ...card,
            mintStatus: 'skipped',
            reason: 'No valid IPFS metadata URI is configured for this card.',
          })
          continue
        }

        try {
          const minted = await mintCardNft(client, config, buyer, card.uri as string)
          fulfilledCards.push({ ...card, ...minted, mintStatus: 'minted' })
        } catch (error) {
          fulfilledCards.push({
            ...card,
            mintStatus: 'failed',
            reason: error instanceof Error ? error.message : 'XRPL minting failed.',
          })
        }
      }

      return NextResponse.json({
        orderId: destinationTag,
        buyer,
        status: 'fulfilled',
        paymentVerified: true,
        paymentTransaction,
        cards: fulfilledCards,
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'XRPL fulfillment failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
