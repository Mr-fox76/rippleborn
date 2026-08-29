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

export type XrplNetwork = 'Testnet' | 'Mainnet'

const XRPL_TESTNET_WEBSOCKET = 'wss://s.altnet.rippletest.net:51233'
const PACK_PRICE_DROPS = '5000000'

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

export function getXrplNetwork(websocketUrl = process.env.XRPL_WSS?.trim()): XrplNetwork {
  const host = (websocketUrl || 'wss://s.altnet.rippletest.net:51233').toLowerCase()
  return host.includes('altnet') || host.includes('testnet') ? 'Testnet' : 'Mainnet'
}

export function getXrplConfig(): XrplConfig {
  const websocketUrl = process.env.XRPL_WSS?.trim() || 'wss://s.altnet.rippletest.net:51233'
  const treasuryAddress = requiredEnvironmentValue('TREASURY_ADDRESS')
  const issuerAddress = requiredEnvironmentValue('ISSUER_ADDRESS')
  const packPriceDrops = requiredEnvironmentValue('PACK_PRICE_DROPS')
  const nftTaxon = parseUnsignedInteger('NFT_TAXON', requiredEnvironmentValue('NFT_TAXON'), 0xffffffff)
  const transferFee = parseUnsignedInteger(
    'TRANSFER_FEE',
    requiredEnvironmentValue('TRANSFER_FEE'),
    50_000,
  )
  const signingSeed = process.env.ISSUER_SEED?.trim() || requiredEnvironmentValue('MINTER_SEED')
  const minterWallet = Wallet.fromSeed(signingSeed)

  if (websocketUrl !== XRPL_TESTNET_WEBSOCKET) {
    throw new Error(`XRPL_WSS must be ${XRPL_TESTNET_WEBSOCKET} while minting is Testnet-only.`)
  }
  if (!isValidClassicAddress(treasuryAddress)) throw new Error('TREASURY_ADDRESS is invalid.')
  if (!isValidClassicAddress(issuerAddress)) throw new Error('ISSUER_ADDRESS is invalid.')
  if (packPriceDrops !== PACK_PRICE_DROPS) {
    throw new Error(`PACK_PRICE_DROPS must be exactly ${PACK_PRICE_DROPS} (5 XRP).`)
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

const PINATA_GATEWAY_ORIGIN = 'https://tomato-fancy-frog-92.mypinata.cloud'

function toHttpsMetadataUri(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY_ORIGIN}/ipfs/${uri.slice('ipfs://'.length)}`
  }
  return uri
}

export function encodeMetadataUri(uri: string | undefined): string | null {
  if (!uri) return null
  const httpsUri = toHttpsMetadataUri(uri)

  try {
    const metadataUrl = new URL(httpsUri)
    const isLedgerbornGatewayUrl =
      metadataUrl.protocol === 'https:' &&
      metadataUrl.origin === PINATA_GATEWAY_ORIGIN &&
      /^\/ipfs\/(bafy|bafk|Qm)[A-Za-z0-9]+\/(?:(?:json|metadata)\/)?[a-z0-9][a-z0-9._-]*\.json$/i.test(
        metadataUrl.pathname,
      )

    if (!isLedgerbornGatewayUrl) return null
  } catch {
    return null
  }

  const encoded = convertStringToHex(httpsUri).toUpperCase()
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
): Promise<{ nftId: string; offerId: string; mintTransactionHash: string }> {
  const uri = encodeMetadataUri(metadataUri)
  if (!uri) throw new Error('Card metadata URI is not a valid HTTPS Pinata JSON URL.')

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
  console.info(`[v0] NFTokenMint succeeded. Decoded URI: ${Buffer.from(uri, 'hex').toString('utf8')}`)

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

  return { nftId, offerId, mintTransactionHash: mintResult.result.hash }
}

export async function accountOwnsNft(
  client: Client,
  account: string,
  nftId: string,
  expectedUri?: string,
): Promise<boolean> {
  const response = await client.request({
    command: 'account_nfts',
    account,
    ledger_index: 'validated',
    limit: 400,
  })
  return response.result.account_nfts.some((token) => {
    if (token.NFTokenID.toUpperCase() !== nftId.toUpperCase()) return false
    return expectedUri ? token.URI === Buffer.from(expectedUri, 'utf8').toString('hex').toUpperCase() : true
  })
}

export type ConfirmedNftClaim =
  | { status: 'pending' }
  | { status: 'failed'; result: string }
  | { status: 'confirmed'; nftId: string }

export async function confirmNftClaim(
  client: Client,
  transactionHash: string,
  buyer: string,
  expectedNftId: string,
): Promise<ConfirmedNftClaim> {
  let transaction
  try {
    transaction = await client.request({
      command: 'tx',
      transaction: transactionHash,
      binary: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/txnNotFound|transaction not found/i.test(message)) return { status: 'pending' }
    throw error
  }

  const result = transaction.result as typeof transaction.result & {
    validated?: boolean
    meta?: TransactionMetadata | string
  }
  if (!result.validated || !result.meta || typeof result.meta === 'string') {
    return { status: 'pending' }
  }
  if (result.meta.TransactionResult !== 'tesSUCCESS') {
    return { status: 'failed', result: result.meta.TransactionResult }
  }

  const accountNfts = await client.request({
    command: 'account_nfts',
    account: buyer,
    ledger_index: 'validated',
    limit: 400,
  })
  const owned = accountNfts.result.account_nfts.some(
    (token) => token.NFTokenID.toUpperCase() === expectedNftId.toUpperCase(),
  )

  return owned ? { status: 'confirmed', nftId: expectedNftId.toUpperCase() } : { status: 'pending' }
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
