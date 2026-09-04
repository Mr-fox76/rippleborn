import { readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const jwt = process.env.PINATA_JWT?.trim()
if (!jwt) throw new Error('PINATA_JWT is required.')

const root = process.cwd()
const imageDirectory = join(root, 'public/sets/cyborg-cowboy/images')
const cards = [
  ['Circuit Trailhand', 'circuit-trailhand', 'Common'],
  ['Neon Wrangler', 'neon-wrangler', 'Common'],
  ['Dustcode Deputy', 'dustcode-deputy', 'Common'],
  ['Servo Prospector', 'servo-prospector', 'Common'],
  ['Chrome Homesteader', 'chrome-homesteader', 'Common'],
  ['Relay Rider', 'relay-rider', 'Common'],
  ['Iron Mesa Marshal', 'iron-mesa-marshal', 'Rare'],
  ['Cobalt Gunsmith', 'cobalt-gunsmith', 'Rare'],
  ['Ghostline Scout', 'ghostline-scout', 'Rare'],
  ['Arcspur Outrider', 'arcspur-outrider', 'Rare'],
  ['Brass Horizon Doc', 'brass-horizon-doc', 'Rare'],
  ['Stormrail Bounty', 'stormrail-bounty', 'Epic'],
  ['Quantum Cardsharp', 'quantum-cardsharp', 'Epic'],
  ['Deadstar Sheriff', 'deadstar-sheriff', 'Epic'],
  ['Sovereign of Sixguns', 'sovereign-of-sixguns', 'Legendary'],
  ['Sunforge Desperado', 'sunforge-desperado', 'Legendary'],
  ['Last Rail Baron', 'last-rail-baron', 'Legendary'],
  ['Warden of Red Orbit', 'warden-of-red-orbit', 'Legendary'],
  ['Gunslinger Zero', 'gunslinger-zero', 'Mythic'],
  ['The Eternity Kid', 'the-eternity-kid', 'Mythic'],
  ['Chrome Stampede', 'chrome-stampede', 'Mythic'],
]

async function pinDirectory(files, name) {
  const form = new FormData()
  for (const file of files) {
    form.append('file', new Blob([await readFile(file.path)], { type: file.type }), file.name)
  }
  form.append('pinataMetadata', JSON.stringify({ name }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1, wrapWithDirectory: true }))

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  })
  const body = await response.json()
  if (!response.ok || typeof body.IpfsHash !== 'string') {
    throw new Error(`Pinata upload failed (${response.status}): ${JSON.stringify(body)}`)
  }
  return body.IpfsHash
}

const imageFiles = cards.map(([, slug]) => ({
  path: join(imageDirectory, `${slug}.png`),
  name: `images/${slug}.png`,
  type: 'image/png',
}))
const imageCid = await pinDirectory(imageFiles, 'Cyborg Cowboy NFT artwork v2')

const metadataFiles = cards.map(([name, slug, rarity]) => ({
  name: `metadata/${slug}.json`,
  type: 'application/json',
  data: JSON.stringify({
    schema: 'https://nft.eips.ethereum.org/erc-721',
    name,
    description: `${name} is a ${rarity} collectible from the Cyborg Cowboy set by RippleBorn.`,
    image: `ipfs://${imageCid}/images/${slug}.png`,
    external_url: 'https://ledgerborn.app/packs/cyborg-cowboy',
    attributes: [
      { trait_type: 'Set', value: 'Cyborg Cowboy' },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Card', value: name },
    ],
  }, null, 2),
}))

const form = new FormData()
for (const file of metadataFiles) {
  form.append('file', new Blob([file.data], { type: file.type }), file.name)
}
form.append('pinataMetadata', JSON.stringify({ name: 'Cyborg Cowboy NFT metadata v2' }))
form.append('pinataOptions', JSON.stringify({ cidVersion: 1, wrapWithDirectory: true }))
const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body: form,
})
const body = await response.json()
if (!response.ok || typeof body.IpfsHash !== 'string') {
  throw new Error(`Pinata metadata upload failed (${response.status}): ${JSON.stringify(body)}`)
}

const result = {
  imageCid,
  metadataCid: body.IpfsHash,
  metadataBaseUri: `ipfs://${body.IpfsHash}/metadata`,
  correctedAt: new Date().toISOString(),
}
await writeFile(join(root, 'scripts/cyborg-metadata-result.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
