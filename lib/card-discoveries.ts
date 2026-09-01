import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packResults } from '@/lib/db/schema'

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

function formatCardIdentifier(orderId: number, rarity: string, cardNumber: number) {
  const packNumber = orderId % 3 === 0 ? 1 : orderId % 3 === 1 ? 2 : 3
  const rarityCode = rarity.trim().charAt(0).toUpperCase() || 'C'
  return `PK${String(packNumber).padStart(2, '0')}-S${String(packNumber).padStart(2, '0')}-${rarityCode}-${String(cardNumber).padStart(4, '0')}`
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
      cardIdentifier: formatCardIdentifier(entry.orderId, entry.rarity, discoveryNumber),
    })
  }
  return result
}

export async function addDiscoveryNumbers<T extends { nftId?: string; name: string }>(cards: T[]) {
  const numbers = await getDiscoveryNumbers(cards.flatMap((card) => card.nftId ? [card.nftId] : []))
  return cards.map((card) => {
    if (!card.nftId) return card
    const discovery = numbers.get(card.nftId.toUpperCase())
    return discovery ? { ...card, ...discovery } : card
  })
}
