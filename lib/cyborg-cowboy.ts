import type { Card, Rarity } from '@/lib/rippleborn'

export const CYBORG_COWBOY_SET_ID = 'cyborg-cowboy' as const

const IMAGE_ROOT = '/sets/cyborg-cowboy/images'
const cards = (rarity: Rarity, entries: Array<[string, string]>) =>
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
} satisfies Record<Rarity, Array<{ name: string; image: string; slug: string; rarity: Rarity }>>

export function rollCyborgCowboyCard(rarity: Rarity, slot: number, metadataBaseUrl: string): Card {
  const pool = CYBORG_COWBOY_POOL[rarity]
  const card = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
    name: card.name,
    rarity,
    slot,
    image: card.image,
    uri: `${metadataBaseUrl.replace(/\/$/, '')}/${card.slug}.json`,
  }
}
