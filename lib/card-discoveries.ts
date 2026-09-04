import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packResults } from '@/lib/db/schema'
import { getCardSetLine } from '@/lib/collection-catalog'
import type { PackSetId } from '@/lib/rippleborn'

export type DiscoveryNumber = {
  discoveryNumber: number
  discoveredTotal: number
  cardIdentifier: string
}

type MintRecord = {
  nftId?: unknown
  name?: unknown
  rarity?: unknown
  mintStatus?: unknown
}

type DiscoveryEntry = {
  nftId: string
  name: string
  rarity: string
  orderId: number
  position: number
}

function formatCardIdentifier(packNumber: number, rarity: string, cardNumber: number) {
  const rarityCode = rarity.trim().charAt(0).toUpperCase() || 'C'
  return `PK${String(packNumber).padStart(2, '0')}-${rarityCode}-${String(cardNumber).padStart(4, '0')}`
}

function normalizeName(name: string) {
  return name.replace(/^Ledgerborn\s+-\s+/i, '').trim().toLowerCase()
}

async function getDiscoveryEntries(): Promise<DiscoveryEntry[]> {
  const rows = await db
    .select({ orderId: packResults.orderId, mintResults: packResults.mintResultsJson })
    .from(packResults)
    .where(eq(packResults.status, 'fulfilled'))
    .orderBy(asc(packResults.orderId))

  return rows.flatMap((row) => {
    if (!Array.isArray(row.mintResults)) return []

    return row.mintResults.flatMap((value, position) => {
      if (!value || typeof value !== 'object') return []
      const card = value as MintRecord
      if (
        card.mintStatus !== 'minted' ||
        typeof card.nftId !== 'string' ||
        typeof card.name !== 'string' ||
        typeof card.rarity !== 'string'
      ) return []
      return [{
        nftId: card.nftId.toUpperCase(),
        name: normalizeName(card.name),
        rarity: card.rarity,
        orderId: row.orderId,
        position,
      }]
    })
  })
}

export async function getDiscoveryNumbers(nftIds?: string[]) {
  const entries = await getDiscoveryEntries()
  const totals = new Map<string, number>()
  const positions = new Map<string, number>()
  const packSequence = new Map<number, number>()

  for (const entry of entries) {
    if (!packSequence.has(entry.orderId)) packSequence.set(entry.orderId, packSequence.size + 1)
  }

  for (const entry of entries) totals.set(entry.name, (totals.get(entry.name) ?? 0) + 1)

  const seen = new Map<string, number>()
  for (const entry of entries) {
    const order = (seen.get(entry.name) ?? 0) + 1
    seen.set(entry.name, order)
    positions.set(entry.nftId, order)
  }

  const requested = nftIds ? new Set(nftIds.map((id) => id.toUpperCase())) : null
  const result = new Map<string, DiscoveryNumber>()
  for (const entry of entries) {
    if (requested && !requested.has(entry.nftId)) continue
    const discoveryNumber = positions.get(entry.nftId) ?? 1
    result.set(entry.nftId, {
      discoveryNumber,
      discoveredTotal: totals.get(entry.name) ?? 1,
      cardIdentifier: formatCardIdentifier(packSequence.get(entry.orderId) ?? 1, entry.rarity, discoveryNumber),
    })
  }
  return result
}

// Counts how many copies of each card name have already been minted across all
// fulfilled packs, optionally excluding one order (the pack currently being frozen,
// or the same order on an idempotent retry). Used to assign the next discovery ordinal.
export async function getDiscoveryCountsByName(excludeOrderId?: number) {
  const rows = await db
    .select({ orderId: packResults.orderId, mintResults: packResults.mintResultsJson })
    .from(packResults)
    .where(eq(packResults.status, 'fulfilled'))

  const counts = new Map<string, number>()
  for (const row of rows) {
    if (excludeOrderId != null && row.orderId === excludeOrderId) continue
    if (!Array.isArray(row.mintResults)) continue
    for (const value of row.mintResults) {
      if (!value || typeof value !== 'object') continue
      const card = value as MintRecord
      if (card.mintStatus !== 'minted' || typeof card.name !== 'string') continue
      const key = normalizeName(card.name)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return counts
}

type EditionCard = {
  name: string
  nftId?: string
  mintStatus?: unknown
  discovery?: number
  discoveredAtPull?: number
  setCode?: string
  cardNumber?: number
  setSize?: number
}

// Freezes the edition line onto each freshly minted card at fulfill time. `discovery`
// and `discoveredAtPull` are the card's own ordinal (Nth copy ever minted), so the very
// first copy stays "1 / 1" and the third stays "3 / 3" forever — later pulls never
// rewrite older cards. Already-frozen cards (retries) keep their stored values.
export async function freezeEditionInfo<T extends EditionCard>(
  orderId: number,
  setId: PackSetId,
  cards: T[],
): Promise<T[]> {
  const priorCounts = await getDiscoveryCountsByName(orderId)
  const running = new Map<string, number>()

  return cards.map((card) => {
    if (card.mintStatus !== 'minted' || !card.nftId) return card
    const setLine = getCardSetLine(card.name, setId)

    if (typeof card.discovery === 'number') {
      return {
        ...card,
        setCode: card.setCode ?? setLine?.code,
        cardNumber: card.cardNumber ?? setLine?.cardNumber,
        setSize: card.setSize ?? setLine?.setSize,
      }
    }

    const key = normalizeName(card.name)
    const within = (running.get(key) ?? 0) + 1
    running.set(key, within)
    const ordinal = (priorCounts.get(key) ?? 0) + within

    return {
      ...card,
      discovery: ordinal,
      discoveredAtPull: ordinal,
      setCode: setLine?.code,
      cardNumber: setLine?.cardNumber,
      setSize: setLine?.setSize,
    }
  })
}

export async function addDiscoveryNumbers<T extends { nftId?: string; name: string }>(cards: T[]) {
  const numbers = await getDiscoveryNumbers(cards.flatMap((card) => card.nftId ? [card.nftId] : []))
  return cards.map((card) => {
    if (!card.nftId) return card
    const discovery = numbers.get(card.nftId.toUpperCase())
    return discovery ? { ...card, ...discovery } : card
  })
}
