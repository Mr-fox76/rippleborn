import { and, count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phoenixCollectionSlots } from '@/lib/db/schema'
import type { PackSetId } from '@/lib/rippleborn'

export const PHOENIX_CAP_PER_COLLECTION = 3

export type PhoenixSupply = {
  minted: number
  remaining: number
  soldOut: boolean
}

export async function getPhoenixSupply(setId: PackSetId): Promise<PhoenixSupply> {
  const [result] = await db
    .select({ value: count() })
    .from(phoenixCollectionSlots)
    .where(and(eq(phoenixCollectionSlots.setId, setId), eq(phoenixCollectionSlots.status, 'minted')))
  const minted = Number(result?.value ?? 0)

  return {
    minted,
    remaining: Math.max(0, PHOENIX_CAP_PER_COLLECTION - minted),
    soldOut: minted >= PHOENIX_CAP_PER_COLLECTION,
  }
}

export async function reservePhoenixSlot(setId: PackSetId, orderId: number): Promise<boolean> {
  const existing = await db
    .select({ id: phoenixCollectionSlots.id })
    .from(phoenixCollectionSlots)
    .where(eq(phoenixCollectionSlots.orderId, orderId))
    .limit(1)
  if (existing.length > 0) return true

  for (let slot = 1; slot <= PHOENIX_CAP_PER_COLLECTION; slot += 1) {
    const inserted = await db
      .insert(phoenixCollectionSlots)
      .values({ setId, slot, orderId })
      .onConflictDoNothing()
      .returning({ id: phoenixCollectionSlots.id })
    if (inserted.length > 0) return true
  }

  return false
}

export async function releasePhoenixSlot(orderId: number) {
  await db
    .delete(phoenixCollectionSlots)
    .where(and(eq(phoenixCollectionSlots.orderId, orderId), eq(phoenixCollectionSlots.status, 'reserved')))
}

export async function markCollectionPhoenixMinted(
  orderId: number,
  nftId: string,
  offerId: string,
) {
  await db
    .update(phoenixCollectionSlots)
    .set({ status: 'minted', nftId, offerId, updatedAt: new Date() })
    .where(eq(phoenixCollectionSlots.orderId, orderId))
}
