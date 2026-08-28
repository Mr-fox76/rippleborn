'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

type ClaimRequest = {
  uuid: string
  qrUrl: string
  deepLink: string
  expiresInSeconds: number
}

type ClaimStatus = {
  status: 'pending' | 'claimed' | 'failed' | 'rejected' | 'expired'
  transactionHash?: string | null
  error?: string
}

const fetcher = async (url: string): Promise<ClaimStatus> => {
  const response = await fetch(url)
  const data = (await response.json()) as ClaimStatus & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Unable to check claim status.')
  return data
}

export function ClaimNftButton({
  buyer,
  nftId,
  offerId,
  onClaimed,
}: {
  buyer: string
  nftId: string
  offerId: string
  onClaimed?: (nftId: string) => void
}) {
  const [claim, setClaim] = useState<ClaimRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: status, error: statusError } = useSWR(
    claim ? `/api/nft/claim/${claim.uuid}` : null,
    fetcher,
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 2500 : 0),
      revalidateOnFocus: true,
    },
  )

  useEffect(() => {
    if (status?.status === 'claimed') onClaimed?.(nftId)
  }, [nftId, onClaimed, status?.status])

  async function createClaim() {
    setCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/nft/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ buyer, nftId, offerId }),
      })
      const data = (await response.json()) as ClaimRequest & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Unable to create claim request.')
      setClaim(data)

      if (window.self !== window.top) {
        window.open(data.deepLink, '_blank', 'noopener,noreferrer')
      }
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to create claim request.')
    } finally {
      setCreating(false)
    }
  }

  if (status?.status === 'claimed') {
    return (
      <div className="mt-3 border-t border-border pt-3 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">Claimed</p>
        {status.transactionHash ? (
          <p className="mt-1 break-all font-mono text-[0.6rem] text-muted-foreground">
            TX {status.transactionHash}
          </p>
        ) : null}
      </div>
    )
  }

  const terminalMessage =
    status?.status === 'rejected'
      ? 'Claim rejected in Xaman.'
      : status?.status === 'expired'
        ? 'Claim request expired. Create a new one.'
        : status?.status === 'failed'
          ? status.error ?? 'The claim failed.'
          : null
  const message = error ?? statusError?.message ?? terminalMessage

  return (
    <div className="mt-3 border-t border-border pt-3 text-center">
      {!claim || terminalMessage ? (
        <button
          type="button"
          onClick={createClaim}
          disabled={creating}
          className="primary-action w-full px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-wait disabled:opacity-60"
        >
          {creating ? 'Preparing Xaman…' : 'Claim NFT'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="qr-panel overflow-hidden p-2">
            <Image src={claim.qrUrl} alt="Scan to claim this NFT in Xaman" width={144} height={144} unoptimized />
          </div>
          <a
            href={claim.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm font-semibold text-gold underline underline-offset-4"
          >
            Open in Xaman
          </a>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            {status?.status === 'pending' ? 'Waiting for signature' : 'Open or scan to sign'}
          </p>
        </div>
      )}
      {message ? <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">{message}</p> : null}
    </div>
  )
}
