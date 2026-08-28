import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packResults } from '@/lib/db/schema'
import type { Card } from '@/lib/rippleborn'

export type MintedPackCard = Card & {
  mintStatus: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  reason?: string
}

export type PackResultRecord = {
  cards: Card[]
  mintResults: MintedPackCard[] | null
  commitment: string
  status: string
}

function canonicalCards(cards: Card[]) {
  return JSON.stringify(
    cards.map((card) => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      slot: card.slot,
      image: card.image,
      uri: card.uri ?? null,
      edition: card.edition ?? null,
      maxSupply: card.maxSupply ?? null,
      limited: card.limited ?? false,
    })),
  )
}

export function createPackCommitment(paymentTxHash: string, cards: Card[]) {
  return createHash('sha256')
    .update(`${paymentTxHash}:${canonicalCards(cards)}`)
    .digest('hex')
}

export async function getPackResult(orderId: number): Promise<PackResultRecord | null> {
  const [record] = await db
    .select({
      cards: packResults.cardsJson,
      mintResults: packResults.mintResultsJson,
      commitment: packResults.commitment,
      status: packResults.status,
    })
    .from(packResults)
    .where(eq(packResults.orderId, orderId))
    .limit(1)

  if (!record) return null

  return {
    cards: record.cards as Card[],
    mintResults: record.mintResults as MintedPackCard[] | null,
    commitment: record.commitment,
    status: record.status,
  }
}

export async function commitPackResult(input: {
  orderId: number
  buyer: string
  paymentTxHash: string
  cards: Card[]
}) {
  const commitment = createPackCommitment(input.paymentTxHash, input.cards)
  const inserted = await db
    .insert(packResults)
    .values({
      orderId: input.orderId,
      buyer: input.buyer,
      paymentTxHash: input.paymentTxHash,
      cardsJson: input.cards,
      commitment,
    })
    .onConflictDoNothing()
    .returning({ commitment: packResults.commitment })

  if (inserted.length > 0) return { cards: input.cards, commitment }

  const existing = await getPackResult(input.orderId)
  if (!existing) throw new Error('This payment is already tied to another pack order.')
  return { cards: existing.cards, commitment: existing.commitment }
}

export async function saveMintResults(orderId: number, cards: MintedPackCard[]) {
  await db
    .update(packResults)
    .set({ status: 'fulfilled', mintResultsJson: cards, errorMessage: null, updatedAt: new Date() })
    .where(eq(packResults.orderId, orderId))
}

export async function markPackFailed(orderId: number, message: string) {
  await db
    .update(packResults)
    .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
    .where(eq(packResults.orderId, orderId))
}
