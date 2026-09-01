import { NextResponse } from 'next/server'
import { getClaimOffer, reconcileOpenClaimOffers } from '@/lib/nft-claim-lifecycle'
import { getXrplWebsocketUrl, validateBuyer, withXrplClient } from '@/lib/xrpl-server'
import { getXamanSdk, isHex256 } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const buyer = validateBuyer(body.buyer)
    const nftId = isHex256(body.nftId) ? body.nftId.toUpperCase() : null
    const offerId = isHex256(body.offerId) ? body.offerId.toUpperCase() : null

    if (!buyer || !nftId || !offerId) {
      return NextResponse.json({ error: 'A valid buyer, NFT ID, and offer ID are required.' }, { status: 400 })
    }

    const lifecycle = await getClaimOffer(offerId)
    if (
      lifecycle &&
      (lifecycle.nftId !== nftId || lifecycle.buyer !== buyer || lifecycle.status !== 'open')
    ) {
      return NextResponse.json({ error: 'This NFT claim is no longer available.' }, { status: 409 })
    }
    if (lifecycle && lifecycle.claimExpiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'The claim window has closed.' }, { status: 410 })
    }

    const websocketUrl = getXrplWebsocketUrl()
    try {
      await withXrplClient(websocketUrl, async (client) => {
        const response = await client.request({ command: 'nft_sell_offers', nft_id: nftId, limit: 100 })
        const offer = response.result.offers.find(
          (candidate) => candidate.nft_offer_index.toUpperCase() === offerId,
        )

        if (!offer) throw new Error('This NFT offer is no longer available.')
        if (offer.amount !== '0') throw new Error('This NFT offer is not a free claim.')
        if (offer.destination !== buyer) throw new Error('This NFT offer belongs to another wallet.')
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/objectNotFound|requested object was not found|no longer available|not found/i.test(message)) {
        if (lifecycle) await reconcileOpenClaimOffers([lifecycle])
        return NextResponse.json(
          {
            code: 'CLAIM_UNAVAILABLE',
            error: 'This NFT has already been claimed or is no longer available.',
          },
          { status: 409 },
        )
      }
      throw error
    }

    const payload = await getXamanSdk().payload.create({
      txjson: {
        TransactionType: 'NFTokenAcceptOffer',
        Account: buyer,
        NFTokenSellOffer: offerId,
      },
      options: {
        submit: true,
        expire: 5,
        force_network: 'MAINNET',
      },
      custom_meta: {
        identifier: `rippleborn-claim-${offerId.slice(0, 12)}`,
        instruction: 'Accept your free Ledgerborn NFT offer on XRPL Mainnet.',
        blob: { buyer, nftId, offerId },
      },
    })

    if (!payload) throw new Error('Xaman did not create a claim request.')

    return NextResponse.json({
      uuid: payload.uuid,
      qrUrl: payload.refs.qr_png,
      deepLink: payload.next.always,
      expiresInSeconds: 300,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the NFT claim.'
    const status = /no longer available|belongs to another|not a free claim/i.test(message) ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
