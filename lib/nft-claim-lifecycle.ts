import 'server-only'

import { and, desc, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nftClaimOffers } from '@/lib/db/schema'
import { accountOwnsNft, getXrplConfig, withXrplClient } from '@/lib/xrpl-server'

export type ClaimOfferStatus = 'open' | 'claimed' | 'cancelling' | 'cancelled' | 'closed'

export function getClaimTtlHours() {
  const raw = process.env.CLAIM_TTL_HOURS?.trim() || '24'
  if (!/^\d+$/.test(raw)) throw new Error('CLAIM_TTL_HOURS must be a positive integer.')
  const hours = Number(raw)
  if (!Number.isSafeInteger(hours) || hours < 1 || hours > 24 * 30) {
    throw new Error('CLAIM_TTL_HOURS must be between 1 and 720.')
  }
  return hours
}

export async function registerClaimOffers(input: {
  orderId: number
  buyer: string
  offers: Array<{ nftId: string; offerId: string; mintedAt: string; claimExpiresAt: string }>
}) {
  if (input.offers.length === 0) return
  await db
    .insert(nftClaimOffers)
    .values(
      input.offers.map((offer) => ({
        offerId: offer.offerId,
        nftId: offer.nftId,
        orderId: input.orderId,
        buyer: input.buyer,
        mintedAt: new Date(offer.mintedAt),
        claimExpiresAt: new Date(offer.claimExpiresAt),
      })),
    )
    .onConflictDoNothing()
}

export async function listOpenClaimOffers(buyer: string) {
  return db
    .select()
    .from(nftClaimOffers)
    .where(
      and(
        eq(nftClaimOffers.buyer, buyer),
        eq(nftClaimOffers.status, 'open'),
        gt(nftClaimOffers.claimExpiresAt, new Date()),
      ),
    )
    .orderBy(desc(nftClaimOffers.mintedAt))
}

export async function getClaimOffer(offerId: string) {
  const [offer] = await db
    .select()
    .from(nftClaimOffers)
    .where(eq(nftClaimOffers.offerId, offerId))
    .limit(1)
  return offer ?? null
}

export async function markClaimOfferClaimed(offerId: string, transactionHash?: string) {
  await db
    .update(nftClaimOffers)
    .set({
      status: 'claimed',
      ...(transactionHash ? { claimTxHash: transactionHash } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'open'),
      ),
    )
}

async function closeOpenClaimOffer(offerId: string) {
  await db
    .update(nftClaimOffers)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'open'),
      ),
    )
}

export async function reconcileOpenClaimOffers(
  offers: Awaited<ReturnType<typeof listOpenClaimOffers>>,
) {
  if (offers.length === 0) return offers

  const config = getXrplConfig()
  return withXrplClient(config.websocketUrl, async (client) => {
    const available = [] as typeof offers

    for (const offer of offers) {
      if (await accountOwnsNft(client, offer.buyer, offer.nftId)) {
        await markClaimOfferClaimed(offer.offerId)
        continue
      }

      if (!(await accountOwnsNft(client, config.minterWallet.address, offer.nftId))) {
        await closeOpenClaimOffer(offer.offerId)
        continue
      }

      try {
        const response = await client.request({
          command: 'nft_sell_offers',
          nft_id: offer.nftId,
          ledger_index: 'validated',
          limit: 100,
        })
        const liveOffer = response.result.offers.find(
          (candidate) => candidate.nft_offer_index.toUpperCase() === offer.offerId.toUpperCase(),
        )
        if (
          liveOffer?.owner === config.minterWallet.address &&
          liveOffer.amount === '0' &&
          liveOffer.destination === offer.buyer
        ) {
          available.push(offer)
        } else {
          await closeOpenClaimOffer(offer.offerId)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!/objectNotFound|requested object was not found|not found/i.test(message)) throw error
        await closeOpenClaimOffer(offer.offerId)
      }
    }

    return available
  })
}

export async function beginOfferCancellation(offerId: string) {
  const [offer] = await db
    .update(nftClaimOffers)
    .set({ status: 'cancelling', updatedAt: new Date() })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'open'),
      ),
    )
    .returning()
  return offer ?? null
}

export async function releaseOfferCancellation(offerId: string) {
  await db
    .update(nftClaimOffers)
    .set({ status: 'open', updatedAt: new Date() })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'cancelling'),
      ),
    )
}

export async function markClaimOfferClosed(offerId: string) {
  await db
    .update(nftClaimOffers)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'cancelling'),
      ),
    )
}

export async function markClaimOfferCancelled(offerId: string, transactionHash: string) {
  await db
    .update(nftClaimOffers)
    .set({
      status: 'cancelled',
      cancelTxHash: transactionHash,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(nftClaimOffers.offerId, offerId),
        eq(nftClaimOffers.status, 'cancelling'),
      ),
    )
}
