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
  theme: {
    id: 'mythic' | 'cyborg'
    eyebrow: string
    title: string
    tagline: string
    introduction: string
    features: readonly [string, string, string]
  }
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
    theme: {
      id: 'mythic',
      eyebrow: 'Ancient powers. Real NFT ownership.',
      title: 'Become Ledgerborn.',
      tagline: 'Chase legends. Awaken The Phoenix.',
      introduction:
        'Enter a realm of mythical characters, legendary beings, and ancient powers. This collection closes permanently when its third Phoenix is successfully minted.',
      features: ['Arcane one-by-one reveals', 'Three Phoenix discoveries', 'Forged and claimed on XRPL'],
    },
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
    theme: {
      id: 'cyborg',
      eyebrow: 'Frontier outlaws. On-ledger ownership.',
      title: 'Ride the machine frontier.',
      tagline: 'Deal the cards. Find the legend. Claim the bounty.',
      introduction:
        'Cross into a dust-choked future where cybernetic marshals, machine outlaws, and hardened drifters rule the frontier. Every pack deals three collectible characters ready to claim on the XRP Ledger.',
      features: ['High-voltage reveals', 'Twenty-one frontier legends', 'Bounties claimed on XRPL'],
    },
  },
]

export function getPack(setId: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((pack) => pack.id === setId)
}
