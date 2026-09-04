import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const jwt = process.env.PINATA_JWT?.trim()
if (!jwt) throw new Error('PINATA_JWT is required.')

const root = process.cwd()
const publicGateway = 'https://tomato-fancy-frog-92.mypinata.cloud/ipfs'

async function pinFiles(files, name) {
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

async function publishSet({ id, metadataDir, imageDir, imageNameForSlug, imagePathForSlug, metadataPrefix = '' }) {
  const metadataNames = (await readdir(metadataDir)).filter((name) => name.endsWith('.json')).sort()
  const entries = await Promise.all(metadataNames.map(async (filename) => {
    const slug = filename.replace(/\.json$/, '')
    const source = JSON.parse(await readFile(join(metadataDir, filename), 'utf8'))
    return {
      filename,
      slug,
      source,
      imageName: imageNameForSlug(slug),
      imagePath: imagePathForSlug ? imagePathForSlug(slug) : join(imageDir, imageNameForSlug(slug)),
    }
  }))

  const uniqueImages = [...new Map(entries.map((entry) => [entry.imageName, entry.imagePath])).entries()]
  const imageCid = await pinFiles(
    uniqueImages.map(([filename, path]) => ({
      path,
      name: `images/${filename}`,
      type: 'image/png',
    })),
    `${id} NFT artwork XLS-24`,
  )

  const metadataFiles = entries.map(({ filename, source, imageName }) => ({
    name: `${metadataPrefix}${filename}`,
    type: 'application/json',
    data: Buffer.from(JSON.stringify({
      schema: 'https://api.xrpldata.com/api/v1/xls20-nft-metadata.json',
      nftType: 'collectible',
      name: source.name,
      description: source.description,
      image: `${publicGateway}/${imageCid}/images/${imageName}`,
      external_url: source.external_url ?? 'https://ledgerborn.app',
      attributes: source.attributes ?? [],
    }, null, 2)),
  }))

  const metadataCid = await pinPreparedFiles(metadataFiles, `${id} NFT metadata XLS-24`)

  return {
    imageCid,
    metadataCid,
    metadataBaseUri: `${publicGateway}/${metadataCid}/${metadataPrefix.replace(/\/$/, '')}`.replace(/\/$/, ''),
  }
}

async function pinPreparedFiles(files, name) {
  const form = new FormData()
  for (const file of files) {
    form.append('file', new Blob([file.data], { type: file.type }), `ledgerborn/${file.name}`)
  }
  form.append('pinataMetadata', JSON.stringify({ name }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1, wrapWithDirectory: false }))
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body: form,
  })
  const body = await response.json()
  if (!response.ok || typeof body.IpfsHash !== 'string') throw new Error(`Pinata upload failed (${response.status}): ${JSON.stringify(body)}`)
  return body.IpfsHash
}

async function publish(options) {
  return publishSet(options)
}

const phoenixMetadata = JSON.parse(await readFile(join(root, 'public/cards/the-phoenix.json'), 'utf8'))

async function publishWithPhoenix(options) {
  const sourcePath = join(options.metadataDir, 'the-phoenix.json')
  let addedPhoenix = false
  try {
    await readFile(sourcePath)
  } catch {
    await writeFile(sourcePath, `${JSON.stringify(phoenixMetadata, null, 2)}\n`)
    addedPhoenix = true
  }

  try {
    return await publish(options)
  } finally {
    if (addedPhoenix) await import('node:fs/promises').then(({ unlink }) => unlink(sourcePath))
  }
}

const mythical = await publishWithPhoenix({
  id: 'Rippleborn Genesis',
  metadataDir: join(root, 'public/cards'),
  imageDir: join(root, 'public/cards'),
  imageNameForSlug: (slug) => slug.startsWith('the-phoenix') ? 'the-phoenix.png' : `${slug === 'archon-flowing-ledgers' ? 'archon-of-flowing-ledgers' : slug}.png`,
})
const cyborg = await publishWithPhoenix({
  id: 'Cyborg Cowboy',
  metadataDir: join(root, 'public/sets/cyborg-cowboy/json'),
  imageDir: join(root, 'public/sets/cyborg-cowboy/images'),
  imageNameForSlug: (slug) => `${slug}.png`,
  imagePathForSlug: (slug) => slug === 'the-phoenix'
    ? join(root, 'public/cards/the-phoenix.png')
    : join(root, 'public/sets/cyborg-cowboy/images', `${slug}.png`),
  metadataPrefix: 'metadata/',
})
const chromatic = await publishWithPhoenix({
  id: 'Chromatic Abyss',
  metadataDir: join(root, 'public/sets/chromatic-abyss/json'),
  imageDir: join(root, 'public/sets/chromatic-abyss/images'),
  imageNameForSlug: (slug) => `${slug}.png`,
  imagePathForSlug: (slug) => slug === 'the-phoenix'
    ? join(root, 'public/cards/the-phoenix.png')
    : join(root, 'public/sets/chromatic-abyss/images', `${slug}.png`),
  metadataPrefix: 'metadata/',
})
const result = {
  mythical,
  cyborg,
  chromatic,
  publishedAt: new Date().toISOString(),
  standard: 'XLS-24',
}
await writeFile(join(root, 'scripts/xls24-metadata-result.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
