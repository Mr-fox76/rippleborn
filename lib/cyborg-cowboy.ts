import type { Card, Rarity } from '@/lib/rippleborn'

export const CYBORG_COWBOY_SET_ID = 'cyborg-cowboy' as const

const IMAGE_ROOT = '/sets/cyborg-cowboy/images'
type CyborgCowboyCard = {
  name: string
  image: string
  slug: string
  rarity: Rarity
  uri?: string
}

const cards = (rarity: Rarity, entries: Array<[string, string]>): CyborgCowboyCard[] =>
  entries.map(([name, slug]) => ({ name, image: `${IMAGE_ROOT}/${slug}.png`, slug, rarity }))

export const CYBORG_COWBOY_POOL = {
  Common: cards('Common', [
    ['Circuit Trailhand', 'circuit-trailhand'], ['Neon Wrangler', 'neon-wrangler'],
    ['Dustcode Deputy', 'dustcode-deputy'], ['Servo Prospector', 'servo-prospector'],
    ['Chrome Homesteader', 'chrome-homesteader'], ['Relay Rider', 'relay-rider'],
  ]),
  Rare: cards('Rare', [
    ['Iron Mesa Marshal', 'iron-mesa-marshal'], ['Cobalt Gunsmith', 'cobalt-gunsmith'],
    ['Ghostline Scout', 'ghostline-scout'], ['Arcspur Outrider', 'arcspur-outrider'],
    ['Brass Horizon Doc', 'brass-horizon-doc'],
  ]),
  Epic: cards('Epic', [
    ['Stormrail Bounty', 'stormrail-bounty'], ['Quantum Cardsharp', 'quantum-cardsharp'],
    ['Deadstar Sheriff', 'deadstar-sheriff'],
  ]),
  Legendary: cards('Legendary', [
    ['Sovereign of Sixguns', 'sovereign-of-sixguns'], ['Sunforge Desperado', 'sunforge-desperado'],
    ['Last Rail Baron', 'last-rail-baron'], ['Warden of Red Orbit', 'warden-of-red-orbit'],
  ]),
  Mythic: cards('Mythic', [
    ['Gunslinger Zero', 'gunslinger-zero'], ['The Eternity Kid', 'the-eternity-kid'],
    ['Chrome Stampede', 'chrome-stampede'],
  ]),
  Phoenix: [
    {
      name: 'The Phoenix',
      image: '/cards/the-phoenix.png',
      slug: 'the-phoenix',
      rarity: 'Phoenix',
      uri: 'https://ledgerborn.com/cards/the-phoenix.json',
    },
  ],
} satisfies Record<Rarity, CyborgCowboyCard[]>

export const CYBORG_COWBOY_NFT_TAXON = 20260827

export const CYBORG_COWBOY_METADATA_CID =
  'bafybeiahusnio5qkjhb6yco6tvgnd6dn75bf7qw6x6itejhchus26mrpcu'
export const CYBORG_COWBOY_IMAGE_CID =
  'bafybeic6jkwvqvtiqopyq7vtxychxfdsa5p4gb5tl5ai6ee2k45ip4djwy'
export const CYBORG_COWBOY_METADATA_BASE_URL =
  `https://tomato-fancy-frog-92.mypinata.cloud/ipfs/${CYBORG_COWBOY_METADATA_CID}/metadata`

export function validateCyborgMetadataBaseUrl(value: string | undefined): string {
  const metadataBaseUrl = value?.trim().replace(/\/$/, '')
  return metadataBaseUrl === CYBORG_COWBOY_METADATA_BASE_URL
    ? metadataBaseUrl
    : CYBORG_COWBOY_METADATA_BASE_URL
}

export function rollCyborgCowboyCard(rarity: Rarity, slot: number, metadataBaseUrl: string): Card {
  const pool = CYBORG_COWBOY_POOL[rarity]
  const card = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
    name: card.name,
    rarity,
    slot,
    image: card.image,
    uri: card.uri ?? `${metadataBaseUrl.replace(/\/$/, '')}/${card.slug}.json`,
  }
}
