import { NextResponse } from 'next/server'
import { getXamanSdk } from '@/lib/xaman-server'

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

    const blob = payload.custom_meta?.blob as { buyer?: unknown } | null | undefined
    const expectedBuyer = typeof blob?.buyer === 'string' ? blob.buyer : null
    const signedAccount = payload.response.account ?? payload.response.signer

    if (payload.meta.signed && expectedBuyer && signedAccount !== expectedBuyer) {
      return NextResponse.json({ status: 'failed', error: 'The claim was signed by the wrong wallet.' })
    }

    if (payload.meta.signed) {
      const dispatched = payload.response.dispatched_result
      if (!dispatched || !payload.response.txid) {
        return NextResponse.json({ status: 'pending' })
      }

      const successful = dispatched === 'tesSUCCESS'
      return NextResponse.json({
        status: successful ? 'claimed' : 'failed',
        transactionHash: payload.response.txid,
        error: successful ? undefined : `XRPL rejected the claim with ${dispatched}.`,
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
