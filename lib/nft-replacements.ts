import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nftReplacements } from '@/lib/db/schema'

export type NftReplacement = typeof nftReplacements.$inferSelect

export async function listNftReplacements(ownerAddress: string) {
  return db
    .select()
    .from(nftReplacements)
    .where(eq(nftReplacements.ownerAddress, ownerAddress))
    .orderBy(nftReplacements.createdAt)
}

export async function getNftReplacement(originalNftId: string, ownerAddress: string) {
  const [replacement] = await db
    .select()
    .from(nftReplacements)
    .where(
      and(
        eq(nftReplacements.originalNftId, originalNftId),
        eq(nftReplacements.ownerAddress, ownerAddress),
      ),
    )
    .limit(1)

  return replacement ?? null
}

export async function markReplacementMinted(
  originalNftId: string,
  ownerAddress: string,
  replacement: { nftId: string; offerId: string; mintTransactionHash: string },
) {
  const [updated] = await db
    .update(nftReplacements)
    .set({
      replacementNftId: replacement.nftId,
      replacementOfferId: replacement.offerId,
      replacementMintTxHash: replacement.mintTransactionHash,
      status: 'offered',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(nftReplacements.originalNftId, originalNftId),
        eq(nftReplacements.ownerAddress, ownerAddress),
        eq(nftReplacements.status, 'eligible'),
      ),
    )
    .returning()

  return updated ?? null
}

export async function markReplacementClaimed(
  originalNftId: string,
  ownerAddress: string,
  transactionHash: string,
) {
  const [updated] = await db
    .update(nftReplacements)
    .set({ replacementClaimTxHash: transactionHash, status: 'claimed', updatedAt: new Date() })
    .where(
      and(
        eq(nftReplacements.originalNftId, originalNftId),
        eq(nftReplacements.ownerAddress, ownerAddress),
      ),
    )
    .returning()

  return updated ?? null
}
