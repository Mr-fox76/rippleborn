import { NextResponse } from 'next/server'
import { getXamanSdk } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const payload = await getXamanSdk().payload.create({
      txjson: { TransactionType: 'SignIn' },
      options: { expire: 5 },
      custom_meta: {
        identifier: 'rippleborn-wallet-connect',
        instruction: 'Sign in with Xaman. Purchases and NFT claims require XRPL Mainnet.',
      },
    }, true)

    if (!payload) throw new Error('Xaman did not create a connection request.')
    console.info('[xaman] Payload created', { uuid: payload.uuid })

    return NextResponse.json({
      uuid: payload.uuid,
      qrUrl: payload.refs.qr_png,
      deepLink: payload.next.always,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect to Xaman.'
    const rateLimited = /(?:error code|status)\s*429|too many requests|rate limit/i.test(message)

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Xaman is temporarily limiting connection requests. Please wait a minute, then try again.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
