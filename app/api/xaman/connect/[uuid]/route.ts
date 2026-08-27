import { NextResponse } from 'next/server'
import { isValidClassicAddress } from 'xrpl'
import { getXamanSdk } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid } = await context.params
    if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
      return NextResponse.json({ error: 'Invalid connection request.' }, { status: 400 })
    }

    const payload = await getXamanSdk().payload.get(uuid)
    if (!payload) return NextResponse.json({ error: 'Connection request not found.' }, { status: 404 })

    if (payload.meta.signed) {
      const account = payload.response.account ?? payload.response.signer
      if (!account || !isValidClassicAddress(account)) {
        return NextResponse.json({ status: 'failed', error: 'Xaman did not return a valid XRPL account.' })
      }
      return NextResponse.json({ status: 'connected', account })
    }

    if (payload.meta.cancelled) return NextResponse.json({ status: 'rejected' })
    if (payload.meta.expired) return NextResponse.json({ status: 'expired' })
    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check Xaman connection.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
