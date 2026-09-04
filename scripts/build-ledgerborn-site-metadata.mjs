// One-time generator: builds ledgerborn.app-served metadata for the Rippleborn Genesis set.
// Reads the existing source JSON in public/cards, rewrites the `image` field to an absolute
// ledgerborn.app URL, forces external_url to the canonical .app site, and writes the files to
// public/sets/ledgerborn/json/<slug>.json so they match the mint allowlist and the other two sets.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const CARDS_DIR = join(ROOT, 'public', 'cards')
const OUT_DIR = join(ROOT, 'public', 'sets', 'ledgerborn', 'json')
const SITE = 'https://ledgerborn.app'

// slug (metadata filename) -> image filename in public/cards, taken from CARD_POOL in lib/rippleborn.ts.
const SLUG_TO_IMAGE = {
  'ledger-acolyte': 'ledger-acolyte.png',
  'tidewatch-scribe': 'tidewatch-scribe.png',
  'shoal-runner': 'shoal-runner.png',
  'consensus-page': 'consensus-page.png',
  'driftglass-sentry': 'driftglass-sentry.png',
  'saltmarsh-courier': 'saltmarsh-courier.png',
  'validator-of-the-deep': 'validator-of-the-deep.png',
  ripplewright: 'ripplewright.png',
  'escrow-warden': 'escrow-warden.png',
  'cobalt-tidecaller': 'cobalt-tidecaller.png',
  'ledgerbound-knight': 'ledgerbound-knight.png',
  'abyssal-consensus': 'abyssal-consensus.png',
  'stormforge-oracle': 'stormforge-oracle.png',
  'warden-of-split-tides': 'warden-of-split-tides.png',
  'archon-flowing-ledgers': 'archon-of-flowing-ledgers.png',
  'leviathan-of-the-first-ledger': 'leviathan-of-the-first-ledger.png',
  'aurelian-tidesovereign': 'aurelian-tidesovereign.png',
  'the-gilded-quorum': 'the-gilded-quorum.png',
  'rippleborn-the-unledgered': 'rippleborn-the-unledgered.png',
  'primordial-tidewyrm': 'primordial-tidewyrm.png',
  'the-phoenix': 'the-phoenix.png',
}

mkdirSync(OUT_DIR, { recursive: true })

const errors = []
let written = 0

for (const [slug, image] of Object.entries(SLUG_TO_IMAGE)) {
  const sourcePath = join(CARDS_DIR, `${slug}.json`)
  const imagePath = join(CARDS_DIR, image)

  if (!existsSync(sourcePath)) {
    errors.push(`Missing source JSON: public/cards/${slug}.json`)
    continue
  }
  if (!existsSync(imagePath)) {
    errors.push(`Missing image: public/cards/${image}`)
    continue
  }

  const metadata = JSON.parse(readFileSync(sourcePath, 'utf8'))
  metadata.image = `${SITE}/cards/${image}`
  metadata.external_url = SITE

  writeFileSync(join(OUT_DIR, `${slug}.json`), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  written += 1
}

if (errors.length > 0) {
  console.error('[build-ledgerborn-site-metadata] FAILED:')
  for (const e of errors) console.error('  -', e)
  process.exit(1)
}

console.log(`[build-ledgerborn-site-metadata] wrote ${written} files to public/sets/ledgerborn/json/`)
