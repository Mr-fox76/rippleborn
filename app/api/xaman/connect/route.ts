import { NextResponse } from 'next/server'
import { getXamanSdk } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const payload = await getXamanSdk().payload.create({
      txjson: { TransactionType: 'SignIn' },
      options: { expire: 5, force_network: 'TESTNET' },
      custom_meta: {
        identifier: 'rippleborn-wallet-connect',
        instruction: 'Connect your XRPL Testnet wallet to Ledgerborn.',
      },
    })

    if (!payload) throw new Error('Xaman did not create a connection request.')

    return NextResponse.json({
      uuid: payload.uuid,
      qrUrl: payload.refs.qr_png,
      deepLink: payload.next.always,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect to Xaman.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
