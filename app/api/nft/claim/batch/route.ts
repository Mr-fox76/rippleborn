import { NextResponse } from 'next/server'
import { getClaimOffer, reconcileOpenClaimOffers } from '@/lib/nft-claim-lifecycle'
import { getXrplWebsocketUrl, validateBuyer, withXrplClient } from '@/lib/xrpl-server'
import { getXamanSdk, isHex256 } from '@/lib/xaman-server'

export const runtime = 'nodejs'

type BatchClaim = { nftId: string; offerId: string }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const buyer = validateBuyer(body.buyer)
    const claims = Array.isArray(body.claims)
      ? body.claims
          .map((claim) => {
            if (!claim || typeof claim !== 'object') return null
            const value = claim as Record<string, unknown>
            const nftId = isHex256(value.nftId) ? value.nftId.toUpperCase() : null
            const offerId = isHex256(value.offerId) ? value.offerId.toUpperCase() : null
            return nftId && offerId ? { nftId, offerId } : null
          })
          .filter((claim): claim is BatchClaim => Boolean(claim))
      : []

    if (!buyer || claims.length < 2 || claims.length > 8) {
      return NextResponse.json({ error: 'A valid buyer and 2–8 NFT claims are required.' }, { status: 400 })
    }
    if (new Set(claims.map((claim) => claim.offerId)).size !== claims.length) {
      return NextResponse.json({ error: 'Duplicate NFT offers are not allowed.' }, { status: 400 })
    }

    const lifecycles = await Promise.all(claims.map((claim) => getClaimOffer(claim.offerId)))
    if (lifecycles.some((lifecycle, index) => lifecycle && (lifecycle.nftId !== claims[index].nftId || lifecycle.buyer !== buyer || lifecycle.status !== 'open'))) {
      return NextResponse.json({ error: 'One or more NFT claims are no longer available.' }, { status: 409 })
    }
    if (lifecycles.some((lifecycle) => lifecycle && lifecycle.claimExpiresAt.getTime() <= Date.now())) {
      return NextResponse.json({ error: 'One or more claim windows have closed.' }, { status: 410 })
    }

    try {
      await withXrplClient(getXrplWebsocketUrl(), async (client) => {
        for (const claim of claims) {
          const response = await client.request({ command: 'nft_sell_offers', nft_id: claim.nftId, limit: 100 })
          const offer = response.result.offers.find((candidate) => candidate.nft_offer_index.toUpperCase() === claim.offerId)
          if (!offer || offer.amount !== '0' || offer.destination !== buyer) throw new Error('One or more NFT offers are no longer available.')
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/objectNotFound|requested object was not found|no longer available|not found/i.test(message)) {
        await reconcileOpenClaimOffers(lifecycles.filter((lifecycle): lifecycle is NonNullable<typeof lifecycle> => Boolean(lifecycle)))
        return NextResponse.json({ code: 'CLAIM_UNAVAILABLE', error: 'One or more NFTs have already been claimed or are no longer available.' }, { status: 409 })
      }
      throw error
    }

    const payload = await getXamanSdk().payload.create({
      txjson: {
        TransactionType: 'Batch',
        Account: buyer,
        Flags: 65536,
        RawTransactions: claims.map((claim) => ({
          RawTransaction: {
            TransactionType: 'NFTokenAcceptOffer',
            Account: buyer,
            NFTokenSellOffer: claim.offerId,
            Flags: 0x40000000,
            Fee: '0',
            SigningPubKey: '',
          },
        })),
      },
      options: { submit: true, expire: 5, force_network: 'MAINNET' },
      custom_meta: {
        identifier: `rippleborn-batch-${claims.map((claim) => claim.offerId.slice(0, 8)).join('-')}`,
        instruction: `Accept ${claims.length} free Ledgerborn NFTs on XRPL Mainnet.`,
        blob: { type: 'nft-claim-batch', buyer, claims },
      },
    })

    if (!payload) throw new Error('Xaman did not create a batch claim request.')
    return NextResponse.json({ uuid: payload.uuid, qrUrl: payload.refs.qr_png, deepLink: payload.next.always, expiresInSeconds: 300 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the batch claim.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
