import 'server-only'

import { sql, eq } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { siteCounters } from '@/lib/db/schema'

const HOME_PAGE_COUNTER = 'homepage'

export async function incrementHomepageVisits(): Promise<bigint | null> {
  try {
    const [counter] = await db
      .insert(siteCounters)
      .values({ counterKey: HOME_PAGE_COUNTER, visitCount: BigInt(1) })
      .onConflictDoUpdate({
        target: siteCounters.counterKey,
        set: {
          visitCount: sql`${siteCounters.visitCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ visitCount: siteCounters.visitCount })

    return counter?.visitCount ?? null
  } catch {
    return null
  }
}

async function queryHomepageVisits(): Promise<bigint | null> {
  try {
    const [counter] = await db
      .select({ visitCount: siteCounters.visitCount })
      .from(siteCounters)
      .where(eq(siteCounters.counterKey, HOME_PAGE_COUNTER))
      .limit(1)
    return counter?.visitCount ?? null
  } catch {
    return null
  }
}

const cachedHomepageVisits = unstable_cache(
  queryHomepageVisits,
  ['homepage-visits'],
  { revalidate: 300, tags: ['homepage-visits'] },
)

export async function getHomepageVisits(): Promise<bigint | null> {
  return cachedHomepageVisits()
}

