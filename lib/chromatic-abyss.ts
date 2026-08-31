import type { Card, Rarity } from '@/lib/rippleborn'

export const CHROMATIC_ABYSS_SET_ID = 'chromatic-abyss' as const
export const CHROMATIC_ABYSS_NFT_TAXON = 20260830
export const CHROMATIC_ABYSS_METADATA_BASE_URL =
  'ipfs://bafybeid74vziobs6hygeknebvm5endcfhhlp4z25cqww3qtjg42if55o74/metadata'

const IMAGE_ROOT = '/sets/chromatic-abyss/images'

type ChromaticCard = {
  name: string
  image: string
  slug: string
  rarity: Rarity
  uri?: string
}

const cards = (rarity: Rarity, entries: Array<[string, string]>): ChromaticCard[] =>
  entries.map(([name, slug]) => ({ name, image: `${IMAGE_ROOT}/${slug}.png`, slug, rarity }))

export const CHROMATIC_ABYSS_POOL = {
  Common: cards('Common', [
    ['Prism Wisp', 'prism-wisp'],
    ['Moss Oracle', 'moss-oracle'],
    ['Velvet Moth', 'velvet-moth'],
    ['Spiral Grazer', 'spiral-grazer'],
    ['Echo Snail', 'echo-snail'],
    ['Lantern Bloom', 'lantern-bloom'],
  ]),
  Rare: cards('Rare', [
    ['Mirror Stag', 'mirror-stag'],
    ['Thought Diver', 'thought-diver'],
    ['Time Eater', 'time-eater'],
    ['Lucid Shepherd', 'lucid-shepherd'],
    ['Cathedral Jelly', 'cathedral-jelly'],
  ]),
  Epic: cards('Epic', [
    ['The Door Between', 'the-door-between'],
    ['Laughing Mountain', 'laughing-mountain'],
    ['Synapse Serpent', 'synapse-serpent'],
  ]),
  Legendary: cards('Legendary', [
    ['Choir of the Unseen', 'choir-of-the-unseen'],
    ['The Garden That Remembers', 'garden-that-remembers'],
    ['Infinity Gardener', 'infinity-gardener'],
    ['The Moon Inside', 'moon-inside'],
  ]),
  Mythic: cards('Mythic', [
    ['The Color Thief', 'color-thief'],
    ['Dream Architect', 'dream-architect'],
    ['The Thousand-Petaled Mind', 'thousand-petaled-mind'],
  ]),
  Phoenix: [
    {
      name: 'The Phoenix',
      image: '/cards/the-phoenix.png',
      slug: 'the-phoenix',
      rarity: 'Phoenix' as const,
      uri: 'https://ledgerborn.com/cards/the-phoenix.json',
    },
  ],
} satisfies Record<Rarity, ChromaticCard[]>

export function rollChromaticAbyssCard(rarity: Rarity, slot: number): Card {
  const pool = CHROMATIC_ABYSS_POOL[rarity]
  const card = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
    name: card.name,
    image: card.image,
    rarity,
    slot,
    uri: card.uri ?? `${CHROMATIC_ABYSS_METADATA_BASE_URL}/${card.slug}.json`,
  }
}
