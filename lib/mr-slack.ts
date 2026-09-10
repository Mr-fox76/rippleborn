import type { Card, Rarity } from '@/lib/rippleborn'

export const MR_SLACK_SET_ID = 'mr-slack' as const
export const MR_SLACK_NFT_TAXON = 20260833
export const MR_SLACK_METADATA_BASE_URL = 'https://ledgerborn.app/sets/mr-slack/json'

const IMAGE_ROOT = '/sets/mr-slack/images'

type MrSlackCard = {
  name: string
  image: string
  slug: string
  rarity: Rarity
  uri?: string
}

const cards = (rarity: Rarity, entries: Array<[string, string]>): MrSlackCard[] =>
  entries.map(([name, slug]) => ({ name, image: `${IMAGE_ROOT}/${slug}.jpg`, slug, rarity }))

export const MR_SLACK_POOL = {
  Common: cards('Common', [
    ['Tired Fox', 'tired-fox'],
    ['Graf Fox', 'graf-fox'],
    ['Scratch-head Fox', 'scratch-head-fox'],
    ['Wasted Fox', 'wasted-fox'],
    ['Freaked Fox', 'freaked-fox'],
    ['The Gentleman', 'the-gentleman'],
  ]),
  Rare: cards('Rare', [
    ['Bruce Lee Fox', 'bruce-lee-fox'],
    ['The Cowboy', 'the-cowboy'],
    ['Vietnam Fox', 'vietnam-fox'],
    ['Pot Head', 'pot-head'],
    ['Space Cadet', 'space-cadet'],
  ]),
  Epic: cards('Epic', [
    ['Punk Fox', 'punk-fox'],
    ['Crypto Fox', 'crypto-fox'],
    ['Robo Fox', 'robo-fox'],
  ]),
  Legendary: cards('Legendary', [
    ['Demon Fox', 'demon-fox'],
    ['Techno Fox', 'techno-fox'],
    ['Red-eye Fox', 'red-eye-fox'],
  ]),
  Mythic: cards('Mythic', [
    ['Ninja Fox', 'ninja-fox'],
    ['Matrix Fox', 'matrix-fox'],
    ['Zen Fox', 'zen-fox'],
  ]),
  // Mr Slack has no Phoenix; its apex is the set-scoped Ultimate tier (Angel Fox).
  Phoenix: [],
  Ultimate: cards('Ultimate', [['Angel Fox', 'angel-fox']]),
} satisfies Record<Rarity, MrSlackCard[]>

export function rollMrSlackCard(rarity: Rarity, slot: number): Card {
  const pool = MR_SLACK_POOL[rarity]
  const card = pool[Math.floor(Math.random() * pool.length)]
  return {
    id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
    name: card.name,
    image: card.image,
    rarity,
    slot,
    uri: `${MR_SLACK_METADATA_BASE_URL}/${card.slug}.json`,
  }
}
