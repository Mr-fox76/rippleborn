import { NextResponse } from 'next/server'
import { markClaimOfferClaimed } from '@/lib/nft-claim-lifecycle'
import { accountOwnsNft, confirmNftClaim, getXrplConfig, withXrplClient } from '@/lib/xrpl-server'
import { getXamanSdk, isHex256 } from '@/lib/xaman-server'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await context.params
    if (!/^[0-9a-f-]{36}$/i.test(uuid)) return NextResponse.json({ error: 'Invalid batch claim request.' }, { status: 400 })
    const payload = await getXamanSdk().payload.get(uuid)
    if (!payload) return NextResponse.json({ error: 'Batch claim request not found.' }, { status: 404 })
    const blob = payload.custom_meta?.blob as { type?: unknown; buyer?: unknown; claims?: unknown } | null | undefined
    if (blob?.type !== 'nft-claim-batch' || typeof blob.buyer !== 'string' || !Array.isArray(blob.claims)) {
      return NextResponse.json({ error: 'Batch claim verification data is incomplete.' }, { status: 500 })
    }
    const claims = blob.claims
      .map((claim) => {
        if (!claim || typeof claim !== 'object') return null
        const value = claim as Record<string, unknown>
        const nftId = isHex256(value.nftId) ? value.nftId.toUpperCase() : null
        const offerId = isHex256(value.offerId) ? value.offerId.toUpperCase() : null
        return nftId && offerId ? { nftId, offerId } : null
      })
      .filter((claim): claim is { nftId: string; offerId: string } => Boolean(claim))
    const signedAccount = payload.response.account ?? payload.response.signer
    if (payload.meta.signed && signedAccount !== blob.buyer) return NextResponse.json({ status: 'failed', error: 'The batch was signed by the wrong wallet.' })
    if (!payload.meta.signed) {
      if (payload.meta.cancelled) return NextResponse.json({ status: 'rejected' })
      if (payload.meta.expired) return NextResponse.json({ status: 'expired' })
      return NextResponse.json({ status: 'pending' })
    }
    const txid = payload.response.txid
    const dispatched = payload.response.dispatched_result
    if (!dispatched || !txid) return NextResponse.json({ status: 'pending' })
    if (dispatched !== 'tesSUCCESS') return NextResponse.json({ status: 'failed', transactionHash: txid, error: `XRPL rejected the batch with ${dispatched}.` })
    const config = getXrplConfig()
    const confirmation = await withXrplClient(config.websocketUrl, async (client) => {
      const first = await confirmNftClaim(client, txid, blob.buyer as string, claims[0].nftId)
      if (first.status !== 'confirmed') return first
      for (const claim of claims.slice(1)) {
        if (!(await accountOwnsNft(client, blob.buyer as string, claim.nftId))) return { status: 'pending' as const }
      }
      return { status: 'confirmed' as const, nftId: claims[0].nftId }
    })
    if (confirmation.status === 'pending') return NextResponse.json({ status: 'pending', transactionHash: txid })
    if (confirmation.status === 'failed') return NextResponse.json({ status: 'failed', transactionHash: txid, error: `XRPL rejected the validated batch with ${confirmation.result}.` })
    await Promise.all(claims.map((claim) => markClaimOfferClaimed(claim.offerId, txid)))
    return NextResponse.json({ status: 'claimed', transactionHash: txid, nftIds: claims.map((claim) => claim.nftId) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to check the batch claim.' }, { status: 500 })
  }
}
