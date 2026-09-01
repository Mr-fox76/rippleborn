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
  packImage: string
  theme: {
    id: 'mythic' | 'cyborg' | 'chromatic'
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
    kicker: 'Mythic',
    description: 'Mythical characters, legendary beings, and ancient powers drawn from the ledger.',
    href: '/packs/ledgerborn',
    cardCount: 21,
    cardsPerPack: 3,
    priceXrp: 5,
    packImage: '/sets/ledgerborn/ledgerborn-mythic-pack-v2.png',
    theme: {
      id: 'mythic',
      eyebrow: 'Ancient powers. Real NFT ownership.',
      title: 'Become Ledgerborn.',
      tagline: 'Chase legends. Awaken The Phoenix.',
      introduction:
        'Enter a realm of mythical characters, legendary beings, and ancient powers. The Phoenix stands above Mythic as the collection’s rarest 0.1% pull.',
      features: ['Arcane one-by-one reveals', 'Phoenix highest rarity', 'Forged and claimed on XRPL'],
    },
  },
  {
    id: 'cyborg-cowboy',
    name: 'Ledgerborn - Cyborg',
    kicker: 'Cyborg',
    description: 'Cinematic outlaws, marshals, and machine legends from a far-future frontier.',
    href: '/packs/cyborg-cowboy',
    cardCount: 22,
    cardsPerPack: 3,
    priceXrp: 5,
    packImage: '/sets/cyborg-cowboy/images/cyborg-cowboy-pack.png',
    theme: {
      id: 'cyborg',
      eyebrow: 'Frontier outlaws. On-ledger ownership.',
      title: 'Ride the machine frontier.',
      tagline: 'Deal the cards. Find the legend. Claim the bounty.',
      introduction:
        'Cross into a dust-choked future where cybernetic marshals, machine outlaws, and hardened drifters rule the frontier. Every pack deals three collectible characters ready to claim on the XRP Ledger.',
      features: ['High-voltage reveals', 'Twenty-two frontier legends', 'Bounties claimed on XRPL'],
    },
  },
  {
    id: 'chromatic-abyss',
    name: 'Ledgerborn - Chromatic',
    kicker: 'Chromatic',
    description: 'Impossible beings, recursive gardens, and lucid entities from beyond the visible spectrum.',
    href: '/packs/chromatic-abyss',
    cardCount: 22,
    cardsPerPack: 3,
    priceXrp: 5,
    packImage: '/sets/chromatic-abyss/pack.png',
    theme: {
      id: 'chromatic',
      eyebrow: 'Lucid visions. On-ledger ownership.',
      title: 'Stare into the Chromatic Abyss.',
      tagline: 'Break the spectrum. Meet what looks back.',
      introduction:
        'Slip beyond ordinary perception into a living spectrum of impossible creatures, recursive temples, and lucid cosmic entities. The Phoenix stands above Mythic as the collection’s rarest 0.1% pull.',
      features: ['Prismatic one-by-one reveals', 'Phoenix highest rarity', 'Visions claimed on XRPL'],
    },
  },
]

export function getPack(setId: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((pack) => pack.id === setId)
}
