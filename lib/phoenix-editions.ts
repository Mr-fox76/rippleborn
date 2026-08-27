import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phoenixEditions } from '@/lib/db/schema'

export const PHOENIX_DROP_CHANCE = 0.001
export const PHOENIX_MAX_SUPPLY = 5

export type PhoenixReservation = {
  edition: number
  metadataUri: string
  status: string
  nftId: string | null
  offerId: string | null
}

function metadataUriForEdition(edition: number) {
  const value = process.env[`PHOENIX_EDITION_${edition}_URI`]
  return value?.startsWith('ipfs://') ? value : null
}

export function phoenixMetadataReady() {
  return Array.from({ length: PHOENIX_MAX_SUPPLY }, (_, index) => metadataUriForEdition(index + 1)).every(Boolean)
}

export async function getPhoenixReservation(orderId: number): Promise<PhoenixReservation | null> {
  const [record] = await db
    .select({
      edition: phoenixEditions.edition,
      metadataUri: phoenixEditions.metadataUri,
      status: phoenixEditions.status,
      nftId: phoenixEditions.nftId,
      offerId: phoenixEditions.offerId,
    })
    .from(phoenixEditions)
    .where(eq(phoenixEditions.orderId, orderId))
    .limit(1)

  return record ?? null
}

export async function reservePhoenixEdition(
  orderId: number,
  buyer: string,
): Promise<PhoenixReservation | null> {
  if (!phoenixMetadataReady()) return null

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(73465001)`)

    const [existing] = await tx
      .select({
        edition: phoenixEditions.edition,
        metadataUri: phoenixEditions.metadataUri,
        status: phoenixEditions.status,
        nftId: phoenixEditions.nftId,
        offerId: phoenixEditions.offerId,
      })
      .from(phoenixEditions)
      .where(eq(phoenixEditions.orderId, orderId))
      .limit(1)

    if (existing) return existing

    const allocated = await tx
      .select({ edition: phoenixEditions.edition })
      .from(phoenixEditions)
      .orderBy(phoenixEditions.edition)

    const used = new Set(allocated.map(({ edition }) => edition))
    const edition = Array.from({ length: PHOENIX_MAX_SUPPLY }, (_, index) => index + 1).find(
      (candidate) => !used.has(candidate),
    )
    if (!edition) return null

    const metadataUri = metadataUriForEdition(edition)
    if (!metadataUri) return null

    const [reservation] = await tx
      .insert(phoenixEditions)
      .values({ orderId, buyer, edition, metadataUri })
      .returning({
        edition: phoenixEditions.edition,
        metadataUri: phoenixEditions.metadataUri,
        status: phoenixEditions.status,
        nftId: phoenixEditions.nftId,
        offerId: phoenixEditions.offerId,
      })

    return reservation
  })
}

export async function markPhoenixMinted(orderId: number, nftId: string, offerId: string) {
  await db
    .update(phoenixEditions)
    .set({ status: 'minted', nftId, offerId, errorMessage: null, updatedAt: new Date() })
    .where(eq(phoenixEditions.orderId, orderId))
}

export async function markPhoenixFailed(orderId: number, message: string) {
  await db
    .update(phoenixEditions)
    .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
    .where(eq(phoenixEditions.orderId, orderId))
}
