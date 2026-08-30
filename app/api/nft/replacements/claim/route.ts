import { NextResponse } from 'next/server'
import { getNftReplacement } from '@/lib/nft-replacements'
import { getXamanSdk } from '@/lib/xaman-server'

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/
const HEX_256 = /^[A-Fa-f0-9]{64}$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { owner?: unknown; originalNftId?: unknown }
    const owner = typeof body.owner === 'string' ? body.owner.trim() : ''
    const originalNftId = typeof body.originalNftId === 'string' ? body.originalNftId.trim().toUpperCase() : ''
    if (!XRPL_ADDRESS.test(owner) || !HEX_256.test(originalNftId)) {
      return NextResponse.json({ error: 'A valid wallet and NFT ID are required.' }, { status: 400 })
    }

    const record = await getNftReplacement(originalNftId, owner)
    if (!record?.replacementOfferId || !record.replacementNftId) {
      return NextResponse.json({ error: 'Prepare the replacement NFT before claiming it.' }, { status: 409 })
    }
    if (record.status === 'claimed') return NextResponse.json({ status: 'claimed', replacement: record })

    const sdk = getXamanSdk()
    const payload = await sdk.payload.create({
      txjson: {
        TransactionType: 'NFTokenAcceptOffer',
        Account: owner,
        NFTokenSellOffer: record.replacementOfferId,
      },
      options: { submit: true, expire: 5, force_network: 'MAINNET' },
      custom_meta: {
        identifier: `ledgerborn-replacement-${originalNftId}`,
        instruction: 'Accept your corrected Ledgerborn NFT replacement.',
        blob: { buyer: owner, nftId: record.replacementNftId, originalNftId, replacement: true },
      },
    })

    if (!payload) throw new Error('Xaman did not return a replacement claim payload.')
    return NextResponse.json({ uuid: payload.uuid, qrPng: payload.refs.qr_png, nextUrl: payload.next.always })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create replacement claim.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
