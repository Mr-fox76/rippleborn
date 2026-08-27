import { NextResponse } from 'next/server'
import { CARDS_PER_PACK, PACK_PRICE_XRP, isLikelyXrplAddress } from '@/lib/rippleborn'

/**
 * DEMO STUB. Returns a mock pack order.
 * A real implementation would record the order server-side and return a
 * deposit address plus a destination tag to watch for on the XRPL.
 * No seeds or private keys are ever handled here.
 */
export async function POST(request: Request) {
  let body: { buyer?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const buyer = typeof body.buyer === 'string' ? body.buyer.trim() : ''

  if (!buyer) {
    return NextResponse.json({ error: 'An XRPL address is required.' }, { status: 400 })
  }

  if (!isLikelyXrplAddress(buyer)) {
    return NextResponse.json(
      { error: 'That does not look like an XRPL address. It should start with "r".' },
      { status: 400 },
    )
  }

  const orderId = `RB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  return NextResponse.json({
    orderId,
    buyer,
    status: 'awaiting_payment',
    priceXrp: PACK_PRICE_XRP,
    cardsPerPack: CARDS_PER_PACK,
    // Placeholder values so the UI can render a full payment step in demo mode.
    destinationAddress: 'rDEMO000000000000000000000000000',
    destinationTag: Math.floor(Math.random() * 4_000_000_000),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    demo: true,
  })
}
