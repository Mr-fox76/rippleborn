import { sleep } from 'workflow'
import {
  beginOfferCancellation,
  markClaimOfferCancelled,
  markClaimOfferClosed,
  releaseOfferCancellation,
} from '@/lib/nft-claim-lifecycle'
import {
  cancelUnclaimedSellOffer,
  getXrplConfig,
  withXrplClient,
} from '@/lib/xrpl-server'

export type UnclaimedOfferCleanupInput = {
  offerId: string
  claimExpiresAt: string
}

async function cancelIfStillUnclaimed(offerId: string) {
  'use step'

  const offer = await beginOfferCancellation(offerId)
  if (!offer) return { status: 'already-handled' as const }

  if (offer.claimExpiresAt.getTime() > Date.now()) {
    await releaseOfferCancellation(offerId)
    return { status: 'not-expired' as const }
  }

  try {
    const config = getXrplConfig()
    const result = await withXrplClient(config.websocketUrl, (client) =>
      cancelUnclaimedSellOffer(client, config, {
        buyer: offer.buyer,
        nftId: offer.nftId,
        offerId: offer.offerId,
      }),
    )

    if (result.status === 'cancelled') {
      await markClaimOfferCancelled(offerId, result.transactionHash)
      console.info(`[lifecycle] Cancelled offer ${offerId}; tx ${result.transactionHash}`)
      return result
    }

    await markClaimOfferClosed(offerId)
    return result
  } catch (error) {
    await releaseOfferCancellation(offerId)
    throw error
  }
}

export async function cleanupUnclaimedOffer(input: UnclaimedOfferCleanupInput) {
  'use workflow'

  await sleep(new Date(input.claimExpiresAt))
  return cancelIfStillUnclaimed(input.offerId)
}
