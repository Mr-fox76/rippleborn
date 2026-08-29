import { NextResponse } from 'next/server'
import { markClaimOfferClaimed } from '@/lib/nft-claim-lifecycle'
import { confirmNftClaim, getXrplConfig, withXrplClient } from '@/lib/xrpl-server'
import { getXamanSdk, isHex256 } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid } = await context.params
    if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
      return NextResponse.json({ error: 'Invalid claim request.' }, { status: 400 })
    }

    const payload = await getXamanSdk().payload.get(uuid)
    if (!payload) return NextResponse.json({ error: 'Claim request not found.' }, { status: 404 })

    const blob = payload.custom_meta?.blob as
      | { buyer?: unknown; nftId?: unknown; offerId?: unknown }
      | null
      | undefined
    const expectedBuyer = typeof blob?.buyer === 'string' ? blob.buyer : null
    const expectedNftId = isHex256(blob?.nftId) ? blob.nftId.toUpperCase() : null
    const expectedOfferId = isHex256(blob?.offerId) ? blob.offerId.toUpperCase() : null
    const signedAccount = payload.response.account ?? payload.response.signer

    if (payload.meta.signed && expectedBuyer && signedAccount !== expectedBuyer) {
      return NextResponse.json({ status: 'failed', error: 'The claim was signed by the wrong wallet.' })
    }

    if (payload.meta.signed) {
      const dispatched = payload.response.dispatched_result
      if (!dispatched || !payload.response.txid) {
        return NextResponse.json({ status: 'pending' })
      }

      if (dispatched !== 'tesSUCCESS') {
        return NextResponse.json({
          status: 'failed',
          transactionHash: payload.response.txid,
          error: `XRPL rejected the claim with ${dispatched}.`,
        })
      }
      if (!expectedBuyer || !expectedNftId) {
        return NextResponse.json({ status: 'failed', error: 'Claim verification data is incomplete.' })
      }

      const config = getXrplConfig()
      const confirmation = await withXrplClient(config.websocketUrl, (client) =>
        confirmNftClaim(client, payload.response.txid as string, expectedBuyer, expectedNftId),
      )
      if (confirmation.status === 'pending') {
        return NextResponse.json({ status: 'pending', transactionHash: payload.response.txid })
      }
      if (confirmation.status === 'failed') {
        return NextResponse.json({
          status: 'failed',
          transactionHash: payload.response.txid,
          error: `XRPL rejected the validated claim with ${confirmation.result}.`,
        })
      }

      if (expectedOfferId) {
        await markClaimOfferClaimed(expectedOfferId, payload.response.txid)
      }

      return NextResponse.json({
        status: 'claimed',
        transactionHash: payload.response.txid,
        nftId: confirmation.nftId,
      })
    }

    if (payload.meta.cancelled) return NextResponse.json({ status: 'rejected' })
    if (payload.meta.expired) return NextResponse.json({ status: 'expired' })
    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check the NFT claim.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
