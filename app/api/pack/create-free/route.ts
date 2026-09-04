import { NextResponse } from 'next/server'
import { CARDS_PER_PACK, isPackSetId } from '@/lib/rippleborn'
import { claimFreeSlot } from '@/lib/free-pack-promo'
import { createDestinationTag, validateBuyer } from '@/lib/xrpl-server'

export const runtime = 'nodejs'

/**
 * Reserves a free pack for the connected wallet. This performs the atomic slot
 * claim (recording the address BEFORE any cards are rolled). The paid 5 XRP
 * path is untouched — this route never charges and never mints; the client
 * still runs the normal fulfill + reveal + optional-mint pipeline afterward
 * with `freeClaim: true`.
 */
export async function POST(request: Request) {
  let body: { buyer?: unknown; setId?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const buyer = validateBuyer(body.buyer)
  const setId = body.setId ?? 'ledgerborn'
  if (!isPackSetId(setId)) {
    return NextResponse.json({ error: 'A valid card set is required.' }, { status: 400 })
  }
  if (setId === 'cyborg-cowboy' && !process.env.CYBORG_COWBOY_METADATA_BASE_URL) {
    return NextResponse.json(
      { error: 'The Cyborg Cowboy pack will be available after its Pinata metadata URL is configured.' },
      { status: 503 },
    )
  }
  if (!buyer) {
    return NextResponse.json({ error: 'A valid XRPL classic address is required.' }, { status: 400 })
  }

  // Encode the set into the order id the same way the paid flow does so the
  // fulfill route's set/remainder validation and pack-result keying match.
  const setRemainder = setId === 'ledgerborn' ? 0 : setId === 'cyborg-cowboy' ? 1 : 2
  const randomTag = createDestinationTag()
  const orderId = randomTag - (randomTag % 3) + setRemainder

  try {
    const result = await claimFreeSlot(buyer, orderId)

    if (result.status === 'sold_out') {
      return NextResponse.json(
        { error: 'All free packs have been claimed. You can still open a pack for 5 XRP.' },
        { status: 409 },
      )
    }

    return NextResponse.json({
      orderId: result.orderId,
      setId,
      buyer,
      free: true,
      resumed: result.status === 'resumed',
      status: 'free_reserved',
      cardsPerPack: CARDS_PER_PACK,
    })
  } catch {
    return NextResponse.json({ error: 'Could not reserve a free pack. Please try again.' }, { status: 500 })
  }
}
