import { NextResponse } from 'next/server'
import { Client, convertHexToString, isValidClassicAddress, type AccountNFToken } from 'xrpl'
import { getDiscoveryNumbers } from '@/lib/card-discoveries'
import { inferCollectionSetId } from '@/lib/collection-catalog'

const MAINNET_WSS = 'wss://xrplcluster.com'
const LEDGERBORN_ISSUER = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'
const PINATA_GATEWAY_ORIGIN = 'https://tomato-fancy-frog-92.mypinata.cloud'
const PUBLIC_IPFS_GATEWAY_ORIGIN = 'https://ipfs.io'
const SITE_METADATA_ORIGIN = 'https://ledgerborn.app'
const IPFS_CID_PATTERN = /^(bafy|bafk|Qm)[A-Za-z0-9]+(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)?$/

function readSiteOriginUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'https:' && url.origin === SITE_METADATA_ORIGIN) return url.toString()
    return null
  } catch {
    return null
  }
}

// Metadata URIs are either legacy IPFS pins or the current ledgerborn.app site URLs.
function readMetadataUrl(decodedUri: string): string | null {
  return publicIpfsUrl(decodedUri) ?? readSiteOriginUrl(decodedUri)
}

// Images are either legacy IPFS art (proxied) or absolute ledgerborn.app URLs (used directly).
function readImageSrc(imageValue: string): string | null {
  return proxiedIpfsUrl(imageValue) ?? readSiteOriginUrl(imageValue)
}

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
  discoveryNumber?: number
  discoveredTotal?: number
  cardIdentifier?: string
  setId?: 'ledgerborn' | 'cyborg-cowboy' | 'chromatic-abyss'
}

function readIpfsPath(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('ipfs://')) {
    const path = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '')
    return IPFS_CID_PATTERN.test(path) ? path : null
  }

  try {
    const url = new URL(trimmed)
    const isSupportedGateway =
      url.protocol === 'https:' &&
      (url.origin === PINATA_GATEWAY_ORIGIN || url.origin === PUBLIC_IPFS_GATEWAY_ORIGIN)
    if (!isSupportedGateway || !url.pathname.startsWith('/ipfs/')) return null
    const path = url.pathname.slice('/ipfs/'.length)
    return IPFS_CID_PATTERN.test(path) ? path : null
  } catch {
    return null
  }
}

function publicIpfsUrl(value: string): string | null {
  const path = readIpfsPath(value)
  return path ? `${PUBLIC_IPFS_GATEWAY_ORIGIN}/ipfs/${path}` : null
}

function proxiedIpfsUrl(value: string): string | null {
  const path = readIpfsPath(value)
  return path ? `/api/collection?media=${encodeURIComponent(path)}` : null
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

  const metadataUrl = readMetadataUrl(decodedUri)
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
    const image = readImageSrc(metadata.image)
    if (!name || !image) return null

    const rarity = readRarity(metadata)
    return {
      tokenId: nft.NFTokenID,
      image,
      name,
      ...(rarity ? { rarity } : {}),
      ...(inferCollectionSetId(name, nft.NFTokenTaxon) ? { setId: inferCollectionSetId(name, nft.NFTokenTaxon) } : {}),
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const mediaPath = searchParams.get('media')?.trim()

  if (mediaPath) {
    if (!IPFS_CID_PATTERN.test(mediaPath)) {
      return NextResponse.json({ error: 'Invalid IPFS media path.' }, { status: 400 })
    }

    try {
      const response = await fetch(`${PUBLIC_IPFS_GATEWAY_ORIGIN}/ipfs/${mediaPath}`, {
        signal: AbortSignal.timeout(15_000),
        cache: 'force-cache',
      })
      const contentType = response.headers.get('content-type')
      if (!response.ok || !contentType?.startsWith('image/')) {
        return NextResponse.json({ error: 'NFT artwork is unavailable.' }, { status: 502 })
      }
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      })
    } catch {
      return NextResponse.json({ error: 'NFT artwork is unavailable.' }, { status: 502 })
    }
  }

  const owner = searchParams.get('owner')?.trim()
  if (!owner || !isValidClassicAddress(owner)) {
    return NextResponse.json({ error: 'Enter a valid XRP Ledger wallet address.' }, { status: 400 })
  }

  // xrplcluster.com occasionally times out on a single connect/query attempt,
  // which previously surfaced as an empty or broken collection. Retry with a
  // fresh client so a transient failure recovers instead of showing no cards.
  const endpoint = process.env.XRPL_WSS?.trim() || MAINNET_WSS
  let owned: AccountNFToken[] | null = null
  let lastError: unknown

  for (let attempt = 0; attempt < 3 && owned === null; attempt += 1) {
    const client = new Client(endpoint, { connectionTimeout: 10_000 })
    try {
      await client.connect()
      const collected: AccountNFToken[] = []
      let marker: unknown

      do {
        const response = await client.request({
          command: 'account_nfts',
          account: owner,
          ledger_index: 'validated',
          limit: 400,
          ...(marker ? { marker } : {}),
        })
        collected.push(...response.result.account_nfts.filter((nft) => nft.Issuer === LEDGERBORN_ISSUER))
        marker = response.result.marker
      } while (marker)

      owned = collected
    } catch (error) {
      lastError = error
    } finally {
      if (client.isConnected()) await client.disconnect().catch(() => undefined)
    }
  }

  if (owned === null) {
    console.log('[v0] collection XRPL read failed after retries:', lastError instanceof Error ? lastError.message : lastError)
    return NextResponse.json({ error: 'Unable to read this wallet from XRP Ledger Mainnet.' }, { status: 502 })
  }

  try {
    const resolved = await Promise.all(owned.map(resolveCard))
    const cards = resolved.filter((card): card is CollectionCard => card !== null)
    const discoveries = await getDiscoveryNumbers(cards.map((card) => card.tokenId))
    const numberedCards = cards.map((card) => {
      const discovery = discoveries.get(card.tokenId.toUpperCase())
      return discovery ? { ...card, ...discovery } : card
    })
    return NextResponse.json(
      { cards: numberedCards },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch {
    return NextResponse.json({ error: 'Unable to read this wallet from XRP Ledger Mainnet.' }, { status: 502 })
  }
}
