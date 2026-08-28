export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const

export type Rarity = (typeof RARITIES)[number]

export type Card = {
  id: string
  name: string
  rarity: Rarity
  slot: number
  /** Local artwork path under /public/cards. Display only — not a token metadata URI. */
  image: string
  /** Public token metadata URI encoded into the XRPL NFT when available. */
  uri?: string
  edition?: number
  maxSupply?: number
  limited?: boolean
}

export const PACK_PRICE_XRP = 5
export const CARDS_PER_PACK = 3

const CARD_WISDOM: Record<string, string> = {
  'Ledger Acolyte': 'Every great path begins with one honest step. Trust what you are learning and keep moving forward.',
  'Tidewatch Scribe': 'Notice the quiet signs around you. Wisdom often arrives softly, long before the tide turns.',
  'Shoal Runner': 'Move with those who lift your spirit. Shared courage carries everyone farther.',
  'Consensus Page': 'Your voice matters, and so does listening. Harmony grows when every truth is given room.',
  'Driftglass Sentry': 'Stay gentle without lowering your guard. Clear boundaries protect the light you carry.',
  'Saltmarsh Courier': 'Good news grows when it is shared. Be the message of hope someone needs today.',
  'Validator of the Deep': 'Stand firm in what you know to be true. Integrity is a beacon even in the deepest waters.',
  Ripplewright: 'Small ripples become mighty currents. Never underestimate the good your actions can set in motion.',
  'Escrow Warden': 'What is meant for you will arrive in its season. Patience protects what haste might lose.',
  'Cobalt Tidecaller': 'Call your dreams closer with brave action. The future listens when intention becomes movement.',
  'Ledgerbound Knight': 'Keep your promises, especially the ones made to yourself. Self-trust is a strength no one can take.',
  'Abyssal Consensus': 'Even in uncertainty, common ground can be found. Seek connection before division.',
  'Stormforge Oracle': 'The storm is shaping you, not stopping you. Let every challenge reveal a stronger vision.',
  'Warden of Split Tides': 'When two paths appear, choose the one that brings you closer to who you wish to become.',
  'Archon of Flowing Ledgers': 'Let abundance flow through you, not merely to you. What you share returns in unexpected forms.',
  'Leviathan of the First Ledger': 'Your beginnings hold more power than you remember. Return to your purpose and rise renewed.',
  'Aurelian Tidesovereign': 'Lead with warmth and others will find their courage. True power leaves light in its wake.',
  'The Gilded Quorum': 'Celebrate the strengths of others. Together, many bright voices become an unshakable song.',
  'Rippleborn, the Unledgered': 'You are not confined by the story already written. Create the next chapter with fearless hope.',
  'Primordial Tidewyrm': 'Ancient strength lives within you. Breathe deeply, trust yourself, and meet the moment whole.',
  'The Phoenix': 'Endings are embers awaiting breath. Release what has passed, keep its lesson, and rise lighter.',
}

export function getCardWisdom(name: string): string {
  return CARD_WISDOM[name] ?? 'Carry hope into what comes next. Your light can change the path ahead.'
}

/**
 * Odds per slot, expressed as weights that sum to 100.
 * Slot 1 is a guaranteed Common, slot 3 carries the chase rarities.
 */
export const SLOT_ODDS: { slot: number; label: string; odds: Partial<Record<Rarity, number>> }[] = [
  { slot: 1, label: 'Slot 1', odds: { Common: 100 } },
  { slot: 2, label: 'Slot 2', odds: { Common: 70, Rare: 30 } },
  { slot: 3, label: 'Slot 3', odds: { Rare: 55, Epic: 30, Legendary: 12, Mythic: 3 } },
]

type CardArt = { name: string; image: string; uri: string }

const CARD_META_FOLDER =
  'https://tomato-fancy-frog-92.mypinata.cloud/ipfs/bafybeibgaqms7fahrd5xsxd6eswei55gmrlflrphql3ovcwoxoobeo3ahy'
const metadataUri = (slug: string) => `${CARD_META_FOLDER}/${slug}.json`

export const CARD_POOL: Record<Rarity, CardArt[]> = {
  Common: [
    { name: 'Ledger Acolyte', image: '/cards/ledger-acolyte.png', uri: metadataUri('ledger-acolyte') },
    { name: 'Tidewatch Scribe', image: '/cards/tidewatch-scribe.png', uri: metadataUri('tidewatch-scribe') },
    { name: 'Shoal Runner', image: '/cards/shoal-runner.png', uri: metadataUri('shoal-runner') },
    { name: 'Consensus Page', image: '/cards/consensus-page.png', uri: metadataUri('consensus-page') },
    { name: 'Driftglass Sentry', image: '/cards/driftglass-sentry.png', uri: metadataUri('driftglass-sentry') },
    { name: 'Saltmarsh Courier', image: '/cards/saltmarsh-courier.png', uri: metadataUri('saltmarsh-courier') },
  ],
  Rare: [
    { name: 'Validator of the Deep', image: '/cards/validator-of-the-deep.png', uri: metadataUri('validator-of-the-deep') },
    { name: 'Ripplewright', image: '/cards/ripplewright.png', uri: metadataUri('ripplewright') },
    { name: 'Escrow Warden', image: '/cards/escrow-warden.png', uri: metadataUri('escrow-warden') },
    { name: 'Cobalt Tidecaller', image: '/cards/cobalt-tidecaller.png', uri: metadataUri('cobalt-tidecaller') },
    { name: 'Ledgerbound Knight', image: '/cards/ledgerbound-knight.png', uri: metadataUri('ledgerbound-knight') },
  ],
  Epic: [
    { name: 'Abyssal Consensus', image: '/cards/abyssal-consensus.png', uri: metadataUri('abyssal-consensus') },
    { name: 'Stormforge Oracle', image: '/cards/stormforge-oracle.png', uri: metadataUri('stormforge-oracle') },
    { name: 'Warden of Split Tides', image: '/cards/warden-of-split-tides.png', uri: metadataUri('warden-of-split-tides') },
  ],
  Legendary: [
    { name: 'Archon of Flowing Ledgers', image: '/cards/archon-of-flowing-ledgers.png', uri: metadataUri('archon-flowing-ledgers') },
    { name: 'Leviathan of the First Ledger', image: '/cards/leviathan-of-the-first-ledger.png', uri: metadataUri('leviathan-of-the-first-ledger') },
    { name: 'Aurelian Tidesovereign', image: '/cards/aurelian-tidesovereign.png', uri: metadataUri('aurelian-tidesovereign') },
    { name: 'The Gilded Quorum', image: '/cards/the-gilded-quorum.png', uri: metadataUri('the-gilded-quorum') },
  ],
  Mythic: [
    { name: 'Rippleborn, the Unledgered', image: '/cards/rippleborn-the-unledgered.png', uri: metadataUri('rippleborn-the-unledgered') },
    { name: 'Primordial Tidewyrm', image: '/cards/primordial-tidewyrm.png', uri: metadataUri('primordial-tidewyrm') },
  ],
}

/** Picks a rarity for a slot using its weighted odds table. */
export function rollRarity(slot: number): Rarity {
  const entry = SLOT_ODDS.find((s) => s.slot === slot) ?? SLOT_ODDS[0]
  const roll = Math.random() * 100
  let cumulative = 0

  for (const rarity of RARITIES) {
    const weight = entry.odds[rarity]
    if (!weight) continue
    cumulative += weight
    if (roll < cumulative) return rarity
  }

  return 'Common'
}

function pickCard(rarity: Rarity): CardArt {
  const pool = CARD_POOL[rarity]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function createPhoenixCard(edition: number, uri: string): Card {
  return {
    id: `3-phoenix-${edition}`,
    name: 'The Phoenix',
    rarity: 'Mythic',
    slot: 3,
    image: '/cards/the-phoenix.png',
    uri,
    edition,
    maxSupply: 5,
    limited: true,
  }
}

/** Rolls a full 3-card pack, one card per slot. */
export function rollPack(): Card[] {
  return SLOT_ODDS.map(({ slot }) => {
    const rarity = rollRarity(slot)
    const { name, image, uri } = pickCard(rarity)
    return {
      id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      rarity,
      slot,
      image,
      uri,
    }
  })
}

/**
 * Loose shape check for an XRPL classic address.
 * Real validation (base58 + checksum) happens on-chain; this only guards the UI.
 */
export function isLikelyXrplAddress(value: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim())
}
