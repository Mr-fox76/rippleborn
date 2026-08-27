export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const

export type Rarity = (typeof RARITIES)[number]

export type Card = {
  id: string
  name: string
  rarity: Rarity
  slot: number
  /** Local artwork path under /public/cards. Display only — not a token metadata URI. */
  image: string
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

type CardArt = { name: string; image: string }

export const CARD_POOL: Record<Rarity, CardArt[]> = {
  Common: [
    { name: 'Ledger Acolyte', image: '/cards/ledger-acolyte.png' },
    { name: 'Tidewatch Scribe', image: '/cards/tidewatch-scribe.png' },
    { name: 'Shoal Runner', image: '/cards/shoal-runner.png' },
    { name: 'Consensus Page', image: '/cards/consensus-page.png' },
    { name: 'Driftglass Sentry', image: '/cards/driftglass-sentry.png' },
    { name: 'Saltmarsh Courier', image: '/cards/saltmarsh-courier.png' },
  ],
  Rare: [
    { name: 'Validator of the Deep', image: '/cards/validator-of-the-deep.png' },
    { name: 'Ripplewright', image: '/cards/ripplewright.png' },
    { name: 'Escrow Warden', image: '/cards/escrow-warden.png' },
    { name: 'Cobalt Tidecaller', image: '/cards/cobalt-tidecaller.png' },
    { name: 'Ledgerbound Knight', image: '/cards/ledgerbound-knight.png' },
  ],
  Epic: [
    { name: 'Archon of Flowing Ledgers', image: '/cards/archon-of-flowing-ledgers.png', uri: "ipfs://bafkreicuzzed4vbpkikrvuij5verhvmgpamdesjbtebvz4bwzp6kvwyfuu" },
    { name: 'Abyssal Consensus', image: '/cards/abyssal-consensus.png' },
    { name: 'Stormforge Oracle', image: '/cards/stormforge-oracle.png' },
    { name: 'Warden of Split Tides', image: '/cards/warden-of-split-tides.png' },
  ],
  Legendary: [
    { name: 'Leviathan of the First Ledger', image: '/cards/leviathan-of-the-first-ledger.png' },
    { name: 'Aurelian Tidesovereign', image: '/cards/aurelian-tidesovereign.png' },
    { name: 'The Gilded Quorum', image: '/cards/the-gilded-quorum.png' },
  ],
  Mythic: [
    { name: 'Rippleborn, the Unledgered', image: '/cards/rippleborn-the-unledgered.png' },
    { name: 'Primordial Tidewyrm', image: '/cards/primordial-tidewyrm.png' },
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

/** Rolls a full 3-card pack, one card per slot. */
export function rollPack(): Card[] {
  return SLOT_ODDS.map(({ slot }) => {
    const rarity = rollRarity(slot)
    const { name, image } = pickCard(rarity)
    return {
      id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      rarity,
      slot,
      image,
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
