'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

type FreeStatus = {
  limit: number
  remaining: number
  alreadyClaimed: boolean
  eligible: boolean
}

/**
 * Slim launch-promo bar: the first 15 wallets each get one free pack.
 * Renders nothing once every free pack has been claimed, so it quietly
 * disappears when the promotion ends.
 */
export function FreePackBanner() {
  const { account } = useXamanWallet()
  const [status, setStatus] = useState<FreeStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      const url = account
        ? `/api/promo/free-pack?address=${encodeURIComponent(account)}`
        : '/api/promo/free-pack'
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) return
      setStatus(await response.json())
    } catch {
      // A promo lookup failure should never break the homepage.
    }
  }, [account])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!status || status.remaining <= 0) return null

  const message = status.alreadyClaimed
    ? 'Your free pack is reserved — pick a set to open it.'
    : status.eligible
      ? "You're one of the first 15 — open one set on us."
      : `Launch gift: the first ${status.limit} wallets each get one free pack.`

  return (
    <Link
      href="#pack-gallery"
      className="group mx-auto flex w-full max-w-3xl items-center justify-center gap-3 rounded-full border border-gold/40 bg-gold/5 px-5 py-2.5 text-center transition-colors hover:border-gold/70 hover:bg-gold/10"
    >
      <Gift className="size-4 shrink-0 text-gold" aria-hidden="true" />
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-foreground sm:text-xs">
        {message}
      </span>
      <span
        className="shrink-0 rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold"
        aria-label={`${status.remaining} of ${status.limit} free packs remaining`}
      >
        {status.remaining}/{status.limit} left
      </span>
    </Link>
  )
}
