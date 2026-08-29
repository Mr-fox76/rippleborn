import { NextResponse } from 'next/server'
import { getClaimOffer } from '@/lib/nft-claim-lifecycle'
import { isHex256 } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const { offerId: rawOfferId } = await context.params
  if (!isHex256(rawOfferId)) {
    return NextResponse.json({ error: 'Invalid offer ID.' }, { status: 400 })
  }

  const offer = await getClaimOffer(rawOfferId.toUpperCase())
  if (!offer) return NextResponse.json({ status: 'unknown' })

  return NextResponse.json({
    status: offer.status,
    claimExpiresAt: offer.claimExpiresAt.toISOString(),
    cancelTransactionHash: offer.cancelTxHash,
  })
}
