import { NextResponse } from 'next/server'
import { getXrplConfig, validateBuyer } from '@/lib/xrpl-server'
import { getXamanSdk } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const buyer = validateBuyer(body.buyer)
    const orderId = body.orderId

    if (!buyer || !Number.isSafeInteger(orderId) || Number(orderId) < 1 || Number(orderId) > 4_294_967_295) {
      return NextResponse.json({ error: 'A valid buyer and pack order are required.' }, { status: 400 })
    }

    const destinationTag = Number(orderId)
    const config = getXrplConfig()
    if (buyer === config.treasuryAddress) {
      return NextResponse.json(
        { error: 'The connected wallet is the treasury wallet. Connect a different Mainnet wallet to buy a pack.' },
        { status: 400 },
      )
    }
    const payload = await getXamanSdk().payload.create({
      txjson: {
        TransactionType: 'Payment',
        Account: buyer,
        Destination: config.treasuryAddress,
        DestinationTag: destinationTag,
        Amount: config.packPriceDrops,
      },
      options: { submit: true, expire: 5, force_network: 'MAINNET' },
      custom_meta: {
        identifier: `rippleborn-pack-${destinationTag}`,
        instruction: `Pay ${config.packPriceDrops} drops for Ledgerborn pack ${destinationTag}.`,
        blob: { kind: 'pack-payment', buyer, destinationTag },
      },
    })

    if (!payload) throw new Error('Xaman did not create a payment request.')

    return NextResponse.json({
      uuid: payload.uuid,
      qrUrl: payload.refs.qr_png,
      deepLink: payload.next.always,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the Xaman payment.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
