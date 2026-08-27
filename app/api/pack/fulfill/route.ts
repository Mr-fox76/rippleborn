import { NextResponse } from 'next/server'
import { isLikelyXrplAddress, rollPack } from '@/lib/rippleborn'

/**
 * DEMO STUB. Rolls and returns 3 cards using the real slot odds,
 * so commons genuinely show up instead of every pack being a hit.
 * A real implementation would verify the XRPL payment for `orderId`
 * before minting, and would mint via a server-held wallet whose seed
 * lives only in an environment variable — never in source.
 */
export async function POST(request: Request) {
  let body: { orderId?: unknown; buyer?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  const buyer = typeof body.buyer === 'string' ? body.buyer.trim() : ''

  if (!orderId) {
    return NextResponse.json({ error: 'Create a pack order first.' }, { status: 400 })
  }

  if (!isLikelyXrplAddress(buyer)) {
    return NextResponse.json({ error: 'A valid XRPL address is required.' }, { status: 400 })
  }

  const cards = rollPack()

  return NextResponse.json({
    orderId,
    buyer,
    status: 'fulfilled',
    paymentVerified: false, // demo mode: no on-chain check performed
    cards,
    demo: true,
  })
}
