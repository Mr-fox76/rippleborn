export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Phoenix'] as const

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
export const PACK_SET_IDS = ['ledgerborn', 'cyborg-cowboy', 'chromatic-abyss'] as const
export type PackSetId = (typeof PACK_SET_IDS)[number]

export function isPackSetId(value: unknown): value is PackSetId {
  return typeof value === 'string' && PACK_SET_IDS.includes(value as PackSetId)
}

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
  'Circuit Trailhand': 'Steady hands build distant horizons. Honor each small task and the trail will open before you.',
  'Neon Wrangler': 'Strength is not control, but patient guidance. Lead with calm and even wild things will trust you.',
  'Dustcode Deputy': 'Stand for what is right when no one is watching. Quiet integrity outlasts every storm.',
  'Servo Prospector': 'Treasure often hides beneath ordinary stone. Keep looking with curious and hopeful eyes.',
  'Chrome Homesteader': 'Make a home wherever courage plants its roots. What you nurture today will shelter tomorrow.',
  'Relay Rider': 'Carry hope swiftly and pass it onward. No good message was ever meant to stop with one soul.',
  'Iron Mesa Marshal': 'True authority begins with service. Protect the path so others can walk it without fear.',
  'Cobalt Gunsmith': 'Shape your gifts with patience and care. Mastery is forged one deliberate choice at a time.',
  'Ghostline Scout': 'The unseen road still leaves signs. Trust your instincts when the horizon offers no map.',
  'Arcspur Outrider': 'Ride beyond the familiar edge. Discovery begins where certainty ends.',
  'Brass Horizon Doc': 'Kindness is frontier medicine. A compassionate hand can restore more than any machine.',
  'Stormrail Bounty': 'Meet the storm without becoming it. Your calm is stronger than the thunder around you.',
  'Quantum Cardsharp': 'Chance favors the prepared spirit. Play boldly, but let wisdom choose the wager.',
  'Deadstar Sheriff': 'Even a fading star can guide the lost. Your light matters most when the night feels endless.',
  'Sovereign of Sixguns': 'Power answers to purpose. Let every strength you carry protect rather than diminish.',
  'Sunforge Desperado': 'You were not made to hide your fire. Temper it with wisdom, then let it light the way.',
  'Last Rail Baron': 'The end of one line is the beginning of another. Build the next route with what the journey taught you.',
  'Warden of Red Orbit': 'Guard your inner world with care. The life around you follows the gravity of your thoughts.',
  'Gunslinger Zero': 'Beginning again is its own kind of legend. Draw courage before doubt can take aim.',
  'The Eternity Kid': 'Wonder keeps the spirit young. Keep one eye on tomorrow and one heart open to today.',
  'Chrome Stampede': 'Momentum grows when courage moves together. Find your herd and run toward the open horizon.',
}

export function getCardWisdom(name: string): string {
  return CARD_WISDOM[name] ?? 'Carry hope into what comes next. Your light can change the path ahead.'
}

/** Converts legacy collection branding for display without changing immutable NFT metadata or mint URIs. */
export function getDisplayCardName(name: string): string {
  return name.replace(/ripple\s*born/gi, 'Ledgerborn')
}

/** Every card position rolls independently from this shared distribution. */
export const SHARED_RARITY_ODDS: Record<Rarity, number> = {
  Common: 56.62,
  Rare: 28.33,
  Epic: 10,
  Legendary: 4,
  Mythic: 1,
  Phoenix: 0.05,
}

export const PACK_SLOTS = [1, 2, 3] as const

type CardArt = { name: string; image: string; uri: string }

export const RIPPLEBORN_METADATA_CID =
  'bafybeie7q4575rkx7k5yhfsakoxuty5pz72oq7v3vtv3gvp4yqgbjntlsm'
export const RIPPLEBORN_METADATA_BASE_URL =
  `https://tomato-fancy-frog-92.mypinata.cloud/ipfs/${RIPPLEBORN_METADATA_CID}`
const metadataUri = (slug: string) => `${RIPPLEBORN_METADATA_BASE_URL}/${slug}.json`

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
  Phoenix: [
    { name: 'The Phoenix', image: '/cards/the-phoenix.png', uri: metadataUri('the-phoenix') },
  ],
}

/** Picks a rarity using the shared distribution used by every pack position. */
export function rollRarity(random = Math.random): Rarity {
  const roll = random() * 100
  let cumulative = 0

  for (const rarity of RARITIES) {
    cumulative += SHARED_RARITY_ODDS[rarity]
    if (roll < cumulative) return rarity
  }

  return 'Mythic'
}

function pickCard(rarity: Rarity): CardArt {
  const pool = CARD_POOL[rarity]
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Rolls and locks a duplicate-free 3-card pack before it is exposed to the client. */
export function rollPack(): Card[] {
  const cards: Card[] = []
  const selectedNames = new Set<string>()

  for (const slot of PACK_SLOTS) {
    let selected: Card | undefined

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const rarity = rollRarity()
      const { name, image, uri } = pickCard(rarity)
      if (selectedNames.has(name)) continue
      selected = {
        id: `${slot}-${Math.random().toString(36).slice(2, 10)}`,
        name,
        rarity,
        slot,
        image,
        uri,
      }
      break
    }

    if (!selected) throw new Error('Unable to create a pack with three unique cards.')
    selectedNames.add(selected.name)
    cards.push(selected)
  }

  return cards
}

/**
 * Loose shape check for an XRPL classic address.
 * Real validation (base58 + checksum) happens on-chain; this only guards the UI.
 */
export function isLikelyXrplAddress(value: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim())
}
