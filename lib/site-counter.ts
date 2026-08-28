import 'server-only'

import { sql } from 'drizzle-orm'
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
