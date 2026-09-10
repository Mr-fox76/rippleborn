import { NextResponse } from 'next/server'
import { markNftRevealed } from '@/lib/pack-results'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { nftId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const nftId =
    typeof body.nftId === 'string' && /^[A-F0-9]{64}$/i.test(body.nftId)
      ? body.nftId.toUpperCase()
      : null
  if (!nftId) {
    return NextResponse.json({ error: 'A valid NFT id is required.' }, { status: 400 })
  }

  try {
    await markNftRevealed(nftId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unable to record the reveal.' }, { status: 500 })
  }
}
