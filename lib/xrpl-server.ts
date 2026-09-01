import 'server-only'

import {
  Client,
  Wallet,
  convertStringToHex,
  isValidClassicAddress,
  type NFTokenCancelOffer,
  type NFTokenCreateOffer,
  type NFTokenMint,
  type TransactionMetadata,
} from 'xrpl'

export type XrplNetwork = 'Testnet' | 'Mainnet'

const XRPL_MAINNET_WEBSOCKET = 'wss://xrplcluster.com'
const RIPPLEBORN_ISSUER_ADDRESS = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'
const PACK_PRICE_DROPS = '5000000'

export type PackPaymentConfig = {
  treasuryAddress: string
  packPriceDrops: string
}

export type XrplConfig = PackPaymentConfig & {
  websocketUrl: string
  issuerAddress: string
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
  const host = (websocketUrl || XRPL_MAINNET_WEBSOCKET).toLowerCase()
  return host.includes('altnet') || host.includes('testnet') ? 'Testnet' : 'Mainnet'
}

export function getXrplWebsocketUrl(): string {
  const websocketUrl = process.env.XRPL_WSS?.trim() || XRPL_MAINNET_WEBSOCKET
  if (websocketUrl !== XRPL_MAINNET_WEBSOCKET) {
    throw new Error(`XRPL_WSS must be ${XRPL_MAINNET_WEBSOCKET} for Mainnet transactions.`)
  }
  return websocketUrl
}

export function getPackPaymentConfig(): PackPaymentConfig {
  const treasuryAddress = requiredEnvironmentValue('TREASURY_ADDRESS')
  const packPriceDrops = requiredEnvironmentValue('PACK_PRICE_DROPS')

  if (!isValidClassicAddress(treasuryAddress)) throw new Error('TREASURY_ADDRESS is invalid.')
  if (packPriceDrops !== PACK_PRICE_DROPS) {
    throw new Error(`PACK_PRICE_DROPS must be exactly ${PACK_PRICE_DROPS} (5 XRP).`)
  }

  return { treasuryAddress, packPriceDrops }
}

export function getXrplConfig(): XrplConfig {
  const websocketUrl = getXrplWebsocketUrl()
  const { treasuryAddress, packPriceDrops } = getPackPaymentConfig()
  const issuerAddress = process.env.ISSUER_ADDRESS?.trim() || RIPPLEBORN_ISSUER_ADDRESS
  const nftTaxon = parseUnsignedInteger('NFT_TAXON', requiredEnvironmentValue('NFT_TAXON'), 0xffffffff)
  const transferFee = parseUnsignedInteger(
    'TRANSFER_FEE',
    requiredEnvironmentValue('TRANSFER_FEE'),
    50_000,
  )
  const minterWallet = Wallet.fromSeed(requiredEnvironmentValue('ISSUER_SEED'))

  if (!isValidClassicAddress(issuerAddress)) throw new Error('ISSUER_ADDRESS is invalid.')
  if (minterWallet.address !== issuerAddress) {
    throw new Error('ISSUER_SEED does not derive the configured ISSUER_ADDRESS.')
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
  nftTaxon = config.nftTaxon,
): Promise<{ nftId: string; offerId: string; mintTransactionHash: string }> {
  const uri = encodeMetadataUri(metadataUri)
  if (!uri) throw new Error('Card metadata URI is not a valid HTTPS Pinata JSON URL.')

  const mint: NFTokenMint = {
    TransactionType: 'NFTokenMint',
    Account: config.minterWallet.address,
    NFTokenTaxon: nftTaxon,
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
  console.info('[xrpl] NFT minted', {
    transactionHash: mintResult.result.hash,
    nftId,
  })

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

export async function cancelUnclaimedSellOffer(
  client: Client,
  config: XrplConfig,
  input: { buyer: string; nftId: string; offerId: string },
): Promise<
  | { status: 'cancelled'; transactionHash: string }
  | { status: 'skip'; reason: 'claimed-or-transferred' | 'offer-not-open' | 'offer-mismatch' }
> {
  const issuerStillOwns = await accountOwnsNft(client, config.minterWallet.address, input.nftId)
  if (!issuerStillOwns) return { status: 'skip', reason: 'claimed-or-transferred' }

  let offers
  try {
    offers = await client.request({
      command: 'nft_sell_offers',
      nft_id: input.nftId,
      ledger_index: 'validated',
      limit: 100,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/objectNotFound|not found/i.test(message)) return { status: 'skip', reason: 'offer-not-open' }
    throw error
  }

  const offer = offers.result.offers.find(
    (candidate) => candidate.nft_offer_index.toUpperCase() === input.offerId.toUpperCase(),
  )
  if (!offer) return { status: 'skip', reason: 'offer-not-open' }
  if (
    offer.owner !== config.minterWallet.address ||
    offer.amount !== '0' ||
    offer.destination !== input.buyer
  ) {
    return { status: 'skip', reason: 'offer-mismatch' }
  }

  const cancellation: NFTokenCancelOffer = {
    TransactionType: 'NFTokenCancelOffer',
    Account: config.minterWallet.address,
    NFTokenOffers: [input.offerId],
  }
  const result = await client.submitAndWait(cancellation, { wallet: config.minterWallet })
  successfulMetadata(result.result, 'NFTokenCancelOffer')
  return { status: 'cancelled', transactionHash: result.result.hash }
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
