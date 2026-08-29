import { NextResponse } from 'next/server'
import { getNftReplacement, markReplacementClaimed } from '@/lib/nft-replacements'
import { confirmNftClaim, getXrplConfig, withXrplClient } from '@/lib/xrpl-server'
import { getXamanSdk, isHex256 } from '@/lib/xaman-server'

export async function GET(_request: Request, context: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await context.params
    const sdk = getXamanSdk()
    const payload = await sdk.payload.get(uuid)
    if (!payload) return NextResponse.json({ status: 'failed', error: 'Replacement claim expired.' })
    if (!payload.meta.resolved) return NextResponse.json({ status: 'pending' })
    if (!payload.meta.signed) return NextResponse.json({ status: 'rejected' })

    const blob = payload.custom_meta?.blob as {
      buyer?: unknown
      nftId?: unknown
      originalNftId?: unknown
      replacement?: unknown
    } | null | undefined
    const owner = typeof blob?.buyer === 'string' ? blob.buyer : ''
    const nftId = isHex256(blob?.nftId) ? blob.nftId.toUpperCase() : ''
    const originalNftId = isHex256(blob?.originalNftId) ? blob.originalNftId.toUpperCase() : ''
    const signedAccount = payload.response.account ?? payload.response.signer
    if (blob?.replacement !== true || !owner || !nftId || !originalNftId || signedAccount !== owner) {
      return NextResponse.json({ status: 'failed', error: 'Replacement claim verification failed.' })
    }

    const record = await getNftReplacement(originalNftId, owner)
    if (!record || record.replacementNftId !== nftId) {
      return NextResponse.json({ status: 'failed', error: 'Replacement record does not match.' })
    }
    const txid = payload.response.txid
    if (!txid) return NextResponse.json({ status: 'failed', error: 'Xaman returned no transaction hash.' })

    const config = getXrplConfig()
    const confirmation = await withXrplClient(config.websocketUrl, (client) =>
      confirmNftClaim(client, txid, owner, nftId),
    )
    if (confirmation.status === 'pending') return NextResponse.json({ status: 'pending', transactionHash: txid })
    if (confirmation.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: `XRPL rejected replacement with ${confirmation.result}.` })
    }

    const updated = await markReplacementClaimed(originalNftId, owner, txid)
    return NextResponse.json({ status: 'claimed', nftId, transactionHash: txid, replacement: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify replacement claim.'
    return NextResponse.json({ status: 'failed', error: message }, { status: 500 })
  }
}
