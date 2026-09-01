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
      return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 })
    }

    const payload = await getXamanSdk().payload.get(uuid)
    if (!payload) return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 })

    const rawBlob = payload.custom_meta?.blob
    let blob: { buyer?: unknown; kind?: unknown } | null = null
    if (typeof rawBlob === 'string') {
      try {
        blob = JSON.parse(rawBlob) as { buyer?: unknown; kind?: unknown }
      } catch {
        blob = null
      }
    } else if (rawBlob && typeof rawBlob === 'object') {
      blob = rawBlob as { buyer?: unknown; kind?: unknown }
    }
    const expectedBuyer = typeof blob?.buyer === 'string' ? blob.buyer : null
    const signedAccount = payload.response.account ?? payload.response.signer

    // Xaman does not consistently return custom_meta.blob from payload.get().
    // The payment is authoritatively verified against its order, destination,
    // amount, tag, and signer during fulfillment after it reaches the ledger.
    if (payload.meta.signed && expectedBuyer && signedAccount !== expectedBuyer) {
      return NextResponse.json({ status: 'failed', error: 'The payment was signed by the wrong wallet.' })
    }

    if (payload.meta.signed) {
      const result = payload.response.dispatched_result
      if (!result || !payload.response.txid) return NextResponse.json({ status: 'pending' })
      return NextResponse.json({
        status: result === 'tesSUCCESS' ? 'submitted' : 'failed',
        transactionHash: payload.response.txid,
        error: result === 'tesSUCCESS' ? undefined : `XRPL rejected the payment with ${result}.`,
      })
    }

    if (payload.meta.cancelled) return NextResponse.json({ status: 'rejected' })
    if (payload.meta.expired) return NextResponse.json({ status: 'expired' })
    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check the Xaman payment.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
