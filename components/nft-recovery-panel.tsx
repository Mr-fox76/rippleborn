'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

type Replacement = {
  originalNftId: string
  cardId: string
  replacementNftId: string | null
  status: string
}

type ClaimRequest = { uuid: string; qrPng: string; nextUrl: string }
type ClaimStatus = { status: string; error?: string }

const cardNames: Record<string, string> = {
  'cobalt-gunsmith': 'Cobalt Gunsmith',
  'circuit-trailhand': 'Circuit Trailhand',
  'neon-wrangler': 'Neon Wrangler',
  'arcspur-outrider': 'Arcspur Outrider',
  'escrow-warden': 'Escrow Warden',
}

async function fetcher(url: string) {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'Unable to load NFT recovery status.')
  return data as { replacements: Replacement[] }
}

export function NftRecoveryPanel() {
  const { account, connect } = useXamanWallet()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [claim, setClaim] = useState<(ClaimRequest & { originalNftId: string }) | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { data, error, mutate } = useSWR(
    account ? `/api/nft/replacements?owner=${encodeURIComponent(account)}` : null,
    fetcher,
  )
  const { data: claimStatus } = useSWR<ClaimStatus>(
    claim ? `/api/nft/replacements/claim/${claim.uuid}` : null,
    async (url: string) => {
      const response = await fetch(url)
      return response.json()
    },
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 4000 : 0),
      onSuccess: (latest) => {
        if (latest.status === 'claimed') {
          setMessage('Replacement ownership confirmed on XRPL. Xaman may take a few minutes to index it.')
          setClaim(null)
          void mutate()
        } else if (['failed', 'rejected'].includes(latest.status)) {
          setMessage(latest.error ?? 'The replacement claim was not completed.')
          setClaim(null)
        }
      },
    },
  )

  async function recover(item: Replacement) {
    if (!account) return
    setBusyId(item.originalNftId)
    setMessage(null)
    try {
      const preparedResponse = await fetch('/api/nft/replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: account, originalNftId: item.originalNftId }),
      })
      const prepared = await preparedResponse.json()
      if (!preparedResponse.ok) throw new Error(prepared.error ?? 'Unable to prepare replacement.')

      const claimResponse = await fetch('/api/nft/replacements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: account, originalNftId: item.originalNftId }),
      })
      const request = await claimResponse.json()
      if (!claimResponse.ok) throw new Error(request.error ?? 'Unable to create Xaman claim.')
      setClaim({ ...request, originalNftId: item.originalNftId })
      window.open(request.nextUrl, '_blank', 'noopener,noreferrer')
      await mutate()
    } catch (recoveryError) {
      setMessage(recoveryError instanceof Error ? recoveryError.message : 'Unable to recover NFT.')
    } finally {
      setBusyId(null)
    }
  }

  const replacements = data?.replacements ?? []
  if (account && !error && replacements.length === 0) return null

  return (
    <details className="group border border-border bg-card text-card-foreground">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors marker:content-none hover:text-gold sm:px-5">
        <span>Recover NFTs</span>
        <span aria-hidden="true" className="text-gold transition-transform group-open:rotate-45">+</span>
      </summary>
      <section className="border-t border-border p-5 sm:p-6" aria-labelledby="recovery-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="recovery-title" className="font-serif text-xl text-balance">Recover NFTs with invalid metadata</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Earlier claims reached your wallet with metadata rejected by explorers. Claim standards-compliant replacements here; the originals remain untouched.
            </p>
          </div>
          {!account ? (
            <button className="border border-gold px-4 py-2 font-mono text-xs uppercase tracking-wider text-gold" onClick={() => void connect()}>
              Connect Xaman
            </button>
          ) : null}
        </div>

      {account ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {replacements.map((item) => (
            <article key={item.originalNftId} className="flex items-center justify-between gap-4 border border-border p-4">
              <div className="min-w-0">
                <h3 className="font-serif text-base">{cardNames[item.cardId] ?? item.cardId}</h3>
                <p className="truncate font-mono text-[0.6rem] text-muted-foreground">{item.originalNftId}</p>
              </div>
              {item.status === 'claimed' ? (
                <span className="font-mono text-xs uppercase text-gold">Recovered</span>
              ) : (
                <button
                  className="shrink-0 border border-gold px-3 py-2 font-mono text-xs uppercase tracking-wider text-gold disabled:opacity-50"
                  disabled={busyId === item.originalNftId || Boolean(claim)}
                  onClick={() => void recover(item)}
                >
                  {busyId === item.originalNftId ? 'Preparing' : item.replacementNftId ? 'Claim' : 'Recover'}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {claim ? (
        <div className="mt-5 flex flex-col items-center gap-3 border border-border p-4 text-center">
          <img src={claim.qrPng} alt="Xaman QR code for the corrected replacement NFT" className="size-44" />
          <a href={claim.nextUrl} target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-wider text-gold underline">
            Open replacement claim in Xaman
          </a>
          <p className="text-sm text-muted-foreground">{claimStatus?.status === 'pending' ? 'Waiting for your signature…' : 'Scan or open Xaman to continue.'}</p>
        </div>
      ) : null}
        {message ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground" role="status">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error.message}</p> : null}
      </section>
    </details>
  )
}
