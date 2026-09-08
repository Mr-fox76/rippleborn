import type { PackSetId, Rarity } from '@/lib/rippleborn'

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
  /** Display-only hero card art used for the pack cover and set link. Never the Phoenix. */
  coverImage: string
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
    coverImage: '/cards/primordial-tidewyrm-cover.png',
    theme: {
      id: 'mythic',
      eyebrow: 'Ancient powers. Real NFT ownership.',
      title: 'Become Ledgerborn.',
      tagline: 'Chase legends. Awaken The Phoenix.',
      introduction:
        'Mythical beings and ancient powers. The Phoenix is the collection’s rarest 0.05% pull.',
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
    coverImage: '/sets/cyborg-cowboy/images/sovereign-of-sixguns.png',
    theme: {
      id: 'cyborg',
      eyebrow: 'Frontier outlaws. On-ledger ownership.',
      title: 'Ride the machine frontier.',
      tagline: 'Deal the cards. Find the legend. Claim the bounty.',
      introduction:
        'A dust-choked future of cybernetic marshals, machine outlaws, and drifters. Every pack deals three collectibles to claim on the XRP Ledger.',
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
    coverImage: '/sets/chromatic-abyss/images/thousand-petaled-mind-cover.png',
    theme: {
      id: 'chromatic',
      eyebrow: 'Lucid visions. On-ledger ownership.',
      title: 'Stare into the Chromatic Abyss.',
      tagline: 'Break the spectrum. Meet what looks back.',
      introduction:
        'A living spectrum of impossible creatures, recursive temples, and lucid entities. The Phoenix is the collection’s rarest 0.05% pull.',
      features: ['Prismatic one-by-one reveals', 'Phoenix highest rarity', 'Visions claimed on XRPL'],
    },
  },
]

/** Display-only preview card shown flanking the sealed pack. Never minted or purchased. */
export type SampleCard = { name: string; rarity: Rarity; image: string }

/**
 * Two fixed sample cards per set, shown either side of the sealed pack so the slots preview
 * real collection art instead of empty frames. Deliberately static (same art every visit) and
 * reset per set when the tab changes.
 */
export const SAMPLE_CARDS: Record<PackSetId, readonly [SampleCard, SampleCard]> = {
  ledgerborn: [
    { name: 'Aurelian Tidesovereign', rarity: 'Legendary', image: '/cards/aurelian-tidesovereign-sample.webp' },
    { name: 'Rippleborn, the Unledgered', rarity: 'Mythic', image: '/cards/rippleborn-the-unledgered-sample.webp' },
  ],
  'cyborg-cowboy': [
    { name: 'Sovereign of Sixguns', rarity: 'Legendary', image: '/sets/cyborg-cowboy/images/sovereign-of-sixguns-sample.webp' },
    { name: 'Gunslinger Zero', rarity: 'Mythic', image: '/sets/cyborg-cowboy/images/gunslinger-zero-sample.webp' },
  ],
  'chromatic-abyss': [
    { name: 'The Moon Inside', rarity: 'Legendary', image: '/sets/chromatic-abyss/images/moon-inside-sample.webp' },
    { name: 'Dream Architect', rarity: 'Mythic', image: '/sets/chromatic-abyss/images/dream-architect-sample.webp' },
  ],
}

export function getPack(setId: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((pack) => pack.id === setId)
}

/** Short URL/tab slug for each set (mythic · cyborg · chromatic). */
export function getPackBySlug(slug: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((pack) => pack.theme.id === slug)
}

/** localStorage key for the last-selected set, shared by the homepage tabs and pack routes. */
export const SELECTED_SET_STORAGE_KEY = 'ledgerborn:selected-set'
