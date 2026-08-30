'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { CheckCircle2, ChevronDown, ExternalLink, LockKeyhole, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type ClaimRequest = {
  uuid: string
  qrUrl: string
  deepLink: string
  expiresInSeconds: number
}

type ClaimStatus = {
  status: 'pending' | 'claimed' | 'failed' | 'rejected' | 'expired'
  transactionHash?: string | null
  nftId?: string
  error?: string
}

type LifecycleStatus = {
  status: 'open' | 'claimed' | 'cancelling' | 'cancelled' | 'closed' | 'unknown'
  claimExpiresAt?: string
  cancelTransactionHash?: string | null
  error?: string
}

const fetcher = async <T extends { error?: string }>(url: string): Promise<T> => {
  const response = await fetch(url)
  const data = (await response.json()) as T
  if (!response.ok) throw new Error(data.error ?? 'Unable to check claim status.')
  return data
}

function ChainDetails({
  nftId,
  offerId,
  transactionHash,
  cancelTransactionHash,
}: {
  nftId: string
  offerId: string
  transactionHash?: string | null
  cancelTransactionHash?: string | null
}) {
  return (
    <details className="rounded-lg bg-muted/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        On-chain details
        <ChevronDown aria-hidden="true" />
      </summary>
      <dl className="flex flex-col gap-3 px-3 pb-3 font-mono text-xs">
        <div className="flex flex-col gap-1">
          <dt className="uppercase tracking-wider text-muted-foreground">NFT ID</dt>
          <dd className="break-all text-foreground">{nftId}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="uppercase tracking-wider text-muted-foreground">Offer ID</dt>
          <dd className="break-all text-foreground">{offerId}</dd>
        </div>
        {transactionHash ? (
          <div className="flex flex-col gap-1">
            <dt className="uppercase tracking-wider text-muted-foreground">Claim transaction</dt>
            <dd className="break-all text-foreground">{transactionHash}</dd>
          </div>
        ) : null}
        {cancelTransactionHash ? (
          <div className="flex flex-col gap-1">
            <dt className="uppercase tracking-wider text-muted-foreground">Cancel transaction</dt>
            <dd className="break-all text-foreground">{cancelTransactionHash}</dd>
          </div>
        ) : null}
      </dl>
    </details>
  )
}

export function ClaimNftButton({
  buyer,
  nftId,
  offerId,
  claimExpiresAt,
  onClaimed,
}: {
  buyer: string
  nftId: string
  offerId: string
  claimExpiresAt?: string
  onClaimed?: (nftId: string) => void
}) {
  const [claim, setClaim] = useState<ClaimRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: status, error: statusError } = useSWR<ClaimStatus>(
    claim ? `/api/nft/claim/${claim.uuid}` : null,
    fetcher,
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 2500 : 0),
      revalidateOnFocus: true,
    },
  )
  const { data: lifecycle } = useSWR<LifecycleStatus>(
    `/api/nft/claim/status/${offerId}`,
    fetcher,
    { refreshInterval: 10_000, revalidateOnFocus: true },
  )
  const effectiveClaimBy = lifecycle?.claimExpiresAt ?? claimExpiresAt
  const isClaimed = status?.status === 'claimed' || lifecycle?.status === 'claimed'
  const offerUnavailable =
    lifecycle?.status === 'cancelled' ||
    lifecycle?.status === 'closed' ||
    lifecycle?.status === 'cancelling'

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
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to create claim request.')
    } finally {
      setCreating(false)
    }
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
  const triggerLabel = isClaimed ? 'Claimed' : offerUnavailable ? 'Claim closed' : 'Claim NFT'

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant={isClaimed ? 'secondary' : offerUnavailable ? 'outline' : 'default'}
            className="w-full font-mono text-xs font-semibold uppercase tracking-wider"
          />
        }
      >
        {isClaimed ? <CheckCircle2 data-icon="inline-start" /> : offerUnavailable ? <LockKeyhole data-icon="inline-start" /> : <ScanLine data-icon="inline-start" />}
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl text-balance">
            {isClaimed ? 'NFT claimed' : offerUnavailable ? 'Claim window closed' : 'Claim your NFT'}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {isClaimed
              ? 'Ownership is confirmed on XRPL. Wallet artwork indexing may take a few minutes.'
              : offerUnavailable
                ? 'The unclaimed sell offer is no longer available.'
                : 'Open this request in Xaman or scan the code to accept your zero-XRP NFT offer.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {effectiveClaimBy && !isClaimed ? (
            <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Claim by{' '}
              <time dateTime={effectiveClaimBy}>
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(effectiveClaimBy))}
              </time>
            </p>
          ) : null}

          {!isClaimed && !offerUnavailable ? (
            !claim || terminalMessage ? (
              <Button type="button" size="lg" onClick={createClaim} disabled={creating}>
                <ScanLine data-icon="inline-start" />
                {creating ? 'Preparing Xaman…' : terminalMessage ? 'Create new Xaman request' : 'Continue with Xaman'}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="qr-panel overflow-hidden p-2">
                  <Image src={claim.qrUrl} alt="Scan to claim this NFT in Xaman" width={176} height={176} unoptimized />
                </div>
                <Button render={<a href={claim.deepLink} target="_blank" rel="noopener noreferrer" />}>
                  <ExternalLink data-icon="inline-start" />
                  Open in Xaman
                </Button>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground" aria-live="polite">
                  {status?.status === 'pending' ? 'Waiting for signature' : 'Open or scan to sign'}
                </p>
              </div>
            )
          ) : null}

          {message && !isClaimed ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-relaxed text-destructive">
              {message}
            </p>
          ) : null}

          <ChainDetails
            nftId={status?.nftId ?? nftId}
            offerId={offerId}
            transactionHash={status?.transactionHash}
            cancelTransactionHash={lifecycle?.cancelTransactionHash}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
