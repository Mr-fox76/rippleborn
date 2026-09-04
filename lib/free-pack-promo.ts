import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { freePackSlots } from '@/lib/db/schema'

/**
 * Site-wide limited promotion: the first 15 unique XRPL wallets each get ONE
 * free pack. This is tracked with a fixed pool of 15 rows in `free_pack_slots`.
 * The paid 5 XRP flow is unaffected — free packs only waive the purchase
 * payment, not the normal open / reveal / optional-mint pipeline.
 */
export const FREE_PACK_LIMIT = 15

export type FreePackStatus = {
  limit: number
  remaining: number
  alreadyClaimed: boolean
  eligible: boolean
}

export type ClaimFreeSlotResult =
  | { status: 'claimed'; orderId: number }
  | { status: 'resumed'; orderId: number }
  | { status: 'sold_out' }

async function countAvailable(): Promise<number> {
  const [row] = await db
    .select({ available: sql<number>`count(*) FILTER (WHERE ${freePackSlots.status} = 'available')::int` })
    .from(freePackSlots)
  return row?.available ?? 0
}

async function findSlotByAddress(address: string) {
  const [row] = await db
    .select({ orderId: freePackSlots.orderId, status: freePackSlots.status })
    .from(freePackSlots)
    .where(eq(freePackSlots.address, address))
    .limit(1)
  return row ?? null
}

export async function getFreePackStatus(address?: string | null): Promise<FreePackStatus> {
  const remaining = await countAvailable()
  let alreadyClaimed = false

  if (address) {
    const existing = await findSlotByAddress(address)
    alreadyClaimed = existing !== null
  }

  return {
    limit: FREE_PACK_LIMIT,
    remaining,
    alreadyClaimed,
    eligible: !alreadyClaimed && remaining > 0,
  }
}

/**
 * Atomically reserve one free slot for `address`, recording `orderId` BEFORE
 * any cards are generated. Race-safe: if two wallets contend for the last slot,
 * `FOR UPDATE SKIP LOCKED` plus the unique address index guarantee only one
 * wins; the loser receives `sold_out`. A wallet that already holds a slot is
 * allowed to resume with its original orderId (never a second free pack).
 */
export async function claimFreeSlot(address: string, orderId: number): Promise<ClaimFreeSlotResult> {
  const existing = await findSlotByAddress(address)
  if (existing) {
    return { status: 'resumed', orderId: existing.orderId ?? orderId }
  }

  const claimed = await db.execute(sql`
    WITH claimable AS (
      SELECT slot FROM free_pack_slots
      WHERE status = 'available'
        AND NOT EXISTS (SELECT 1 FROM free_pack_slots s2 WHERE s2.address = ${address})
      ORDER BY slot
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE free_pack_slots f
    SET status = 'claimed', address = ${address}, order_id = ${orderId}, updated_at = now()
    FROM claimable
    WHERE f.slot = claimable.slot
    RETURNING f.slot
  `)

  if (claimed.rows.length > 0) {
    return { status: 'claimed', orderId }
  }

  // No slot was updated. Either the promo is sold out, or a concurrent request
  // for the same wallet just recorded a slot — re-check the address to resume.
  const afterRace = await findSlotByAddress(address)
  if (afterRace) {
    return { status: 'resumed', orderId: afterRace.orderId ?? orderId }
  }
  return { status: 'sold_out' }
}

/** Confirms `orderId` is a free slot reserved by `address` (used by fulfill). */
export async function isFreeOrderForBuyer(orderId: number, address: string): Promise<boolean> {
  const [row] = await db
    .select({ slot: freePackSlots.slot })
    .from(freePackSlots)
    .where(and(eq(freePackSlots.orderId, orderId), eq(freePackSlots.address, address)))
    .limit(1)
  return Boolean(row)
}
