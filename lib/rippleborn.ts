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

const CARD_METADATA_ROOT = 'ipfs://bafybeif4eujk6kj3ox3l4cpfmoc5kc3uig5umfspybwyh7fwlqr37tm3ma'
const metadataUri = (filename: string) => `${CARD_METADATA_ROOT}/${filename}.json`

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
    { name: 'Archon of Flowing Ledgers', image: '/cards/archon-of-flowing-ledgers.png', uri: metadataUri('archon-flowing-ledgers') },
    { name: 'Abyssal Consensus', image: '/cards/abyssal-consensus.png', uri: metadataUri('abyssal-consensus') },
    { name: 'Stormforge Oracle', image: '/cards/stormforge-oracle.png', uri: metadataUri('stormforge-oracle') },
    { name: 'Warden of Split Tides', image: '/cards/warden-of-split-tides.png', uri: metadataUri('warden-of-split-tides') },
  ],
  Legendary: [
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
