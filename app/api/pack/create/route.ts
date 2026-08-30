import { NextResponse } from 'next/server'
import { dropsToXrp } from 'xrpl'
import { getPhoenixSupply } from '@/lib/phoenix-supply'
import { CARDS_PER_PACK, isPackSetId } from '@/lib/rippleborn'
import { createDestinationTag, getXrplConfig, validateBuyer } from '@/lib/xrpl-server'

export const runtime = 'nodejs'

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

  try {
    const supply = await getPhoenixSupply(setId)
    if (supply.soldOut) {
      return NextResponse.json(
        { error: 'This collection is closed. All three Phoenix cards have been found.' },
        { status: 410 },
      )
    }

    const config = getXrplConfig()
    if (buyer === config.treasuryAddress) {
      return NextResponse.json(
        { error: 'The connected wallet is the treasury wallet. Connect a different Mainnet wallet to buy a pack.' },
        { status: 400 },
      )
    }
    const randomTag = createDestinationTag()
    const setRemainder = setId === 'ledgerborn' ? 0 : setId === 'cyborg-cowboy' ? 1 : 2
    const destinationTag = randomTag - (randomTag % 3) + setRemainder

    return NextResponse.json({
      orderId: destinationTag,
      setId,
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
