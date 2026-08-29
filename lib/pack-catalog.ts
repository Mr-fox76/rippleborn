import type { PackSetId } from '@/lib/rippleborn'

export type PackCatalogEntry = {
  id: PackSetId
  name: string
  kicker: string
  description: string
  href: `/packs/${PackSetId}`
  cardCount: number
  cardsPerPack: number
  priceXrp: number
}

export const PACK_CATALOG: readonly PackCatalogEntry[] = [
  {
    id: 'ledgerborn',
    name: 'Ledgerborn - Mythic',
    kicker: 'Mythical Set',
    description: 'Mythical characters, legendary beings, and ancient powers drawn from the ledger.',
    href: '/packs/ledgerborn',
    cardCount: 25,
    cardsPerPack: 3,
    priceXrp: 5,
  },
  {
    id: 'cyborg-cowboy',
    name: 'Ledgerborn - Cyborg',
    kicker: 'Frontier Set',
    description: 'Cinematic outlaws, marshals, and machine legends from a far-future frontier.',
    href: '/packs/cyborg-cowboy',
    cardCount: 21,
    cardsPerPack: 3,
    priceXrp: 5,
  },
]

export function getPack(setId: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((pack) => pack.id === setId)
}
