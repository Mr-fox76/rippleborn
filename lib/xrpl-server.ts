import 'server-only'

import {
  Client,
  Wallet,
  convertStringToHex,
  isValidClassicAddress,
  type NFTokenCreateOffer,
  type NFTokenMint,
  type TransactionMetadata,
} from 'xrpl'

export type XrplConfig = {
  websocketUrl: string
  treasuryAddress: string
  issuerAddress: string
  packPriceDrops: string
  nftTaxon: number
  transferFee: number
  minterWallet: Wallet
}

type TransactionResult = {
  meta?: TransactionMetadata | string
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

function parseUnsignedInteger(name: string, value: string, maximum: number): number {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be an unsigned integer.`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new Error(`${name} must be between 0 and ${maximum}.`)
  }
  return parsed
}

export function getXrplConfig(): XrplConfig {
  const websocketUrl = requiredEnvironmentValue('XRPL_WSS')
  const treasuryAddress = requiredEnvironmentValue('TREASURY_ADDRESS')
  const issuerAddress = requiredEnvironmentValue('ISSUER_ADDRESS')
  const packPriceDrops = requiredEnvironmentValue('PACK_PRICE_DROPS')
  const nftTaxon = parseUnsignedInteger('NFT_TAXON', requiredEnvironmentValue('NFT_TAXON'), 0xffffffff)
  const transferFee = parseUnsignedInteger(
    'TRANSFER_FEE',
    requiredEnvironmentValue('TRANSFER_FEE'),
    50_000,
  )
  const minterWallet = Wallet.fromSeed(requiredEnvironmentValue('MINTER_SEED'))

  if (!isValidClassicAddress(treasuryAddress)) throw new Error('TREASURY_ADDRESS is invalid.')
  if (!isValidClassicAddress(issuerAddress)) throw new Error('ISSUER_ADDRESS is invalid.')
  if (!/^\d+$/.test(packPriceDrops) || BigInt(packPriceDrops) <= BigInt(0)) {
    throw new Error('PACK_PRICE_DROPS must be a positive drops amount.')
  }

  return {
    websocketUrl,
    treasuryAddress,
    issuerAddress,
    packPriceDrops,
    nftTaxon,
    transferFee,
    minterWallet,
  }
}

export function createDestinationTag(): number {
  const bytes = crypto.getRandomValues(new Uint32Array(1))
  return bytes[0]
}

export function parseDestinationTag(value: unknown): number | null {
  const candidate = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isInteger(candidate) && candidate >= 0 && candidate <= 0xffffffff ? candidate : null
}

export function validateBuyer(value: unknown): string | null {
  const buyer = typeof value === 'string' ? value.trim() : ''
  return isValidClassicAddress(buyer) ? buyer : null
}

export function encodeMetadataUri(uri: string | undefined): string | null {
  if (!uri?.startsWith('ipfs://')) return null
  const cid = uri.slice('ipfs://'.length)
  if (!/^b[a-z2-7]{20,}$/i.test(cid)) return null
  const encoded = convertStringToHex(uri).toUpperCase()
  return encoded.length <= 512 ? encoded : null
}

function successfulMetadata(result: TransactionResult, transactionName: string): TransactionMetadata {
  const meta = result.meta
  if (!meta || typeof meta === 'string') throw new Error(`${transactionName} did not return metadata.`)
  if (meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`${transactionName} failed with ${meta.TransactionResult}.`)
  }
  return meta
}

export async function mintCardNft(
  client: Client,
  config: XrplConfig,
  buyer: string,
  metadataUri: string,
): Promise<{ nftId: string; offerId: string }> {
  const uri = encodeMetadataUri(metadataUri)
  if (!uri) throw new Error('Card metadata URI is not a valid IPFS URI.')

  const mint: NFTokenMint = {
    TransactionType: 'NFTokenMint',
    Account: config.minterWallet.address,
    NFTokenTaxon: config.nftTaxon,
    URI: uri,
    Flags: 8,
  }

  if (config.transferFee > 0) mint.TransferFee = config.transferFee
  if (config.issuerAddress !== config.minterWallet.address) mint.Issuer = config.issuerAddress

  const mintResult = await client.submitAndWait(mint, { wallet: config.minterWallet })
  const mintMeta = successfulMetadata(mintResult.result, 'NFTokenMint') as TransactionMetadata & {
    nftoken_id?: string
  }
  const nftId = mintMeta.nftoken_id
  if (!nftId) throw new Error('NFTokenMint succeeded but returned no token ID.')

  const offer: NFTokenCreateOffer = {
    TransactionType: 'NFTokenCreateOffer',
    Account: config.minterWallet.address,
    NFTokenID: nftId,
    Amount: '0',
    Destination: buyer,
    Flags: 1,
  }
  const offerResult = await client.submitAndWait(offer, { wallet: config.minterWallet })
  const offerMeta = successfulMetadata(offerResult.result, 'NFTokenCreateOffer') as TransactionMetadata & {
    offer_id?: string
  }
  const offerId = offerMeta.offer_id
  if (!offerId) throw new Error('NFTokenCreateOffer succeeded but returned no offer ID.')

  return { nftId, offerId }
}

export async function withXrplClient<T>(
  websocketUrl: string,
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client(websocketUrl)
  try {
    await client.connect()
    return await operation(client)
  } finally {
    if (client.isConnected()) await client.disconnect()
  }
}
