import { NextResponse } from 'next/server'
import { Client, convertHexToString, isValidClassicAddress, type AccountNFToken } from 'xrpl'

const MAINNET_WSS = 'wss://xrplcluster.com'
const LEDGERBORN_ISSUER = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'
const PINATA_GATEWAY_ORIGIN = 'https://tomato-fancy-frog-92.mypinata.cloud'
const IPFS_CID_PATTERN = /^(bafy|bafk|Qm)[A-Za-z0-9]+(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)?$/

type Metadata = {
  name?: unknown
  image?: unknown
  rarity?: unknown
  attributes?: unknown
}

type CollectionCard = {
  tokenId: string
  image: string
  name: string
  rarity?: string
}

function toSafeGatewayUrl(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('ipfs://')) {
    const path = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '')
    return IPFS_CID_PATTERN.test(path) ? `${PINATA_GATEWAY_ORIGIN}/ipfs/${path}` : null
  }

  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' && url.origin === PINATA_GATEWAY_ORIGIN && url.pathname.startsWith('/ipfs/')
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function readRarity(metadata: Metadata): string | undefined {
  if (typeof metadata.rarity === 'string' && metadata.rarity.trim()) return metadata.rarity.trim()
  if (!Array.isArray(metadata.attributes)) return undefined

  for (const attribute of metadata.attributes) {
    if (!attribute || typeof attribute !== 'object') continue
    const entry = attribute as { trait_type?: unknown; value?: unknown }
    if (
      typeof entry.trait_type === 'string' &&
      entry.trait_type.toLowerCase() === 'rarity' &&
      typeof entry.value === 'string' &&
      entry.value.trim()
    ) {
      return entry.value.trim()
    }
  }

  return undefined
}

async function resolveCard(nft: AccountNFToken): Promise<CollectionCard | null> {
  if (!nft.URI) return null

  let decodedUri: string
  try {
    decodedUri = convertHexToString(nft.URI)
  } catch {
    return null
  }

  const metadataUrl = toSafeGatewayUrl(decodedUri)
  if (!metadataUrl) return null

  try {
    const response = await fetch(metadataUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    })
    if (!response.ok) return null

    const metadata = (await response.json()) as Metadata
    if (typeof metadata.name !== 'string' || typeof metadata.image !== 'string') return null

    const name = metadata.name.trim()
    const image = toSafeGatewayUrl(metadata.image)
    if (!name || !image) return null

    const rarity = readRarity(metadata)
    return {
      tokenId: nft.NFTokenID,
      image,
      name,
      ...(rarity ? { rarity } : {}),
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get('owner')?.trim()
  if (!owner || !isValidClassicAddress(owner)) {
    return NextResponse.json({ error: 'Enter a valid XRP Ledger wallet address.' }, { status: 400 })
  }

  const client = new Client(MAINNET_WSS, { connectionTimeout: 8_000 })

  try {
    await client.connect()
    const owned: AccountNFToken[] = []
    let marker: unknown

    do {
      const response = await client.request({
        command: 'account_nfts',
        account: owner,
        ledger_index: 'validated',
        limit: 400,
        ...(marker ? { marker } : {}),
      })
      owned.push(...response.result.account_nfts.filter((nft) => nft.Issuer === LEDGERBORN_ISSUER))
      marker = response.result.marker
    } while (marker)

    const resolved = await Promise.all(owned.map(resolveCard))
    return NextResponse.json({ cards: resolved.filter((card): card is CollectionCard => card !== null) })
  } catch {
    return NextResponse.json({ error: 'Unable to read this wallet from XRP Ledger Mainnet.' }, { status: 502 })
  } finally {
    if (client.isConnected()) await client.disconnect().catch(() => undefined)
  }
}
