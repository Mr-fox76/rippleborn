import { NextResponse } from 'next/server'
import { getFreePackStatus } from '@/lib/free-pack-promo'
import { validateBuyer } from '@/lib/xrpl-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = validateBuyer(searchParams.get('address'))

  try {
    const status = await getFreePackStatus(address)
    return NextResponse.json(status)
  } catch {
    // Never let a promo lookup break the page — treat failures as "no promo".
    return NextResponse.json({ limit: 15, remaining: 0, alreadyClaimed: false, eligible: false })
  }
}
