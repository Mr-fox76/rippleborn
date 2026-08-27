import { NextResponse } from 'next/server'
import { dropsToXrp } from 'xrpl'
import { CARDS_PER_PACK } from '@/lib/rippleborn'
import { createDestinationTag, getXrplConfig, validateBuyer } from '@/lib/xrpl-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { buyer?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const buyer = validateBuyer(body.buyer)
  if (!buyer) {
    return NextResponse.json({ error: 'A valid XRPL classic address is required.' }, { status: 400 })
  }

  try {
    const config = getXrplConfig()
    const destinationTag = createDestinationTag()

    return NextResponse.json({
      orderId: destinationTag,
      buyer,
      status: 'awaiting_payment',
      cardsPerPack: CARDS_PER_PACK,
      Destination: config.treasuryAddress,
      destinationAddress: config.treasuryAddress,
      Amount: config.packPriceDrops,
      amountDrops: config.packPriceDrops,
      priceXrp: dropsToXrp(config.packPriceDrops),
      DestinationTag: destinationTag,
      destinationTag,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'XRPL configuration is unavailable.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
