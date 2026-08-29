import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { CYBORG_COWBOY_POOL } from '@/lib/cyborg-cowboy'
import { db } from '@/lib/db'
import { packResults } from '@/lib/db/schema'
import { CARD_POOL, type Card, type PackSetId } from '@/lib/rippleborn'

export type MintedPackCard = Card & {
  mintStatus: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  mintedAt?: string
  claimExpiresAt?: string
  reason?: string
}

export type PackResultRecord = {
  cards: Card[]
  mintResults: MintedPackCard[] | null
  commitment: string
  status: string
}

export type CollectionStats = {
  packsOpened: number
  legendaryFound: number
  mythicFound: number
  limitedFound: number
  phoenixFound: number
}

export const EMPTY_COLLECTION_STATS: CollectionStats = {
  packsOpened: 0,
  legendaryFound: 0,
  mythicFound: 0,
  limitedFound: 0,
  phoenixFound: 0,
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

export async function getCollectionStats(setId?: PackSetId): Promise<CollectionStats> {
  const fulfilledPacks = await db
    .select({ cards: packResults.cardsJson })
    .from(packResults)
    .where(eq(packResults.status, 'fulfilled'))
  const setCardNames = setId
    ? new Set(
        Object.values(setId === 'cyborg-cowboy' ? CYBORG_COWBOY_POOL : CARD_POOL)
          .flat()
          .map((card) => card.name),
      )
    : null

  return fulfilledPacks.reduce<CollectionStats>(
    (stats, record) => {
      const cards = (record.cards as Card[]).filter((card) => !setCardNames || setCardNames.has(card.name))
      if (setCardNames && cards.length === 0) return stats

      stats.packsOpened += 1

      for (const card of cards) {
        if (card.limited) stats.limitedFound += 1
        if (card.name === 'The Phoenix') {
          stats.phoenixFound += 1
        } else if (card.rarity === 'Legendary') {
          stats.legendaryFound += 1
        } else if (card.rarity === 'Mythic') {
          stats.mythicFound += 1
        }
      }

      return stats
    },
    { ...EMPTY_COLLECTION_STATS },
  )
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
