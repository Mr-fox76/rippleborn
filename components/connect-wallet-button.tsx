'use client'

import Image from 'next/image'
import { Loader2, LogOut, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-5)}`
}

export function ConnectWalletButton() {
  const { account, request, status, creating, error, connect, disconnect } = useXamanWallet()

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-xs text-gold sm:inline">{shortAddress(account)}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="ghost-action font-mono text-xs uppercase tracking-[0.14em]"
          aria-label={`Disconnect wallet ${account}`}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-end gap-1">
      <Button
        size="lg"
        onClick={connect}
        disabled={creating || status?.status === 'pending'}
        className="primary-action min-h-11 px-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] sm:min-h-12 sm:min-w-52 sm:px-6 sm:text-xs sm:tracking-[0.14em]"
      >
        {creating || status?.status === 'pending' ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Wallet className="size-5" aria-hidden="true" />
        )}
        {status?.status === 'pending' ? 'Waiting for Xaman' : 'Connect Xaman'}
      </Button>

      {request ? (
        <div className="qr-panel fixed inset-x-4 top-24 z-50 mx-auto flex max-h-[calc(100dvh-7rem)] w-auto max-w-56 flex-col items-center gap-3 overflow-y-auto p-4 text-center sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:mx-0 sm:w-56">
          <Image
            src={request.qrUrl}
            alt="Scan to connect your wallet in Xaman"
            width={160}
            height={160}
            unoptimized
          />
          <a
            href={request.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gold underline underline-offset-4"
          >
            Open in Xaman
          </a>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            Scan or open to connect
          </p>
        </div>
      ) : null}

      {error ? <p role="alert" className="max-w-64 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
