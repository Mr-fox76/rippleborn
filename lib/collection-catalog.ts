import { CHROMATIC_ABYSS_POOL } from '@/lib/chromatic-abyss'
import { CYBORG_COWBOY_POOL } from '@/lib/cyborg-cowboy'
import { CARD_POOL, RARITIES, getDisplayCardName, type PackSetId, type Rarity } from '@/lib/rippleborn'

export type CollectionCatalogSlot = {
  key: string
  name: string
  rarity: Rarity
  position: number
}

export type CollectionCatalogSet = {
  id: PackSetId
  label: string
  slots: CollectionCatalogSlot[]
}

const SET_LABELS: Record<PackSetId, string> = {
  ledgerborn: 'Ledgerborn Mythic',
  'cyborg-cowboy': 'Cyborg Cowboy',
  'chromatic-abyss': 'Chromatic Abyss',
}

const pools = {
  ledgerborn: CARD_POOL,
  'cyborg-cowboy': CYBORG_COWBOY_POOL,
  'chromatic-abyss': CHROMATIC_ABYSS_POOL,
} as const

export function normalizeCollectionCardName(value: string): string {
  return getDisplayCardName(value)
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

export const COLLECTION_CATALOG: CollectionCatalogSet[] = Object.entries(pools).map(([id, pool]) => {
  let position = 0
  const slots = RARITIES.flatMap((rarity) =>
    pool[rarity].map((card) => {
      position += 1
      const name = getDisplayCardName(card.name)
      return {
        key: `${id}:${normalizeCollectionCardName(name)}`,
        name,
        rarity,
        position,
      }
    }),
  )

  return {
    id: id as PackSetId,
    label: SET_LABELS[id as PackSetId],
    slots,
  }
})

const setsByName = new Map<string, PackSetId[]>()
for (const set of COLLECTION_CATALOG) {
  for (const slot of set.slots) {
    const normalized = normalizeCollectionCardName(slot.name)
    const setIds = setsByName.get(normalized) ?? []
    if (!setIds.includes(set.id)) setIds.push(set.id)
    setsByName.set(normalized, setIds)
  }
}

export function inferCollectionSetId(name: string, taxon?: number): PackSetId | undefined {
  if (taxon === 20260827) return 'cyborg-cowboy'
  if (taxon === 20260830) return 'chromatic-abyss'

  const matches = setsByName.get(normalizeCollectionCardName(name)) ?? []
  return matches.length === 1 ? matches[0] : matches.includes('ledgerborn') ? 'ledgerborn' : matches[0]
}

export function getCollectionSlotKey(setId: PackSetId, name: string): string {
  return `${setId}:${normalizeCollectionCardName(name)}`
}
