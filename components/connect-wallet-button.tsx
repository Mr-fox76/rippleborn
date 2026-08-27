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
          className="border-primary/40 bg-transparent text-primary hover:bg-primary/10 hover:text-primary"
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
        className="min-h-12 border border-gold bg-gold px-6 font-semibold text-card shadow-lg shadow-gold/20 hover:bg-gold/90 hover:text-card sm:min-w-52"
      >
        {creating || status?.status === 'pending' ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Wallet className="size-5" aria-hidden="true" />
        )}
        {status?.status === 'pending' ? 'Waiting for Xaman' : 'Connect wallet'}
      </Button>

      {request ? (
        <div className="absolute right-0 top-14 z-50 flex w-56 flex-col items-center gap-3 border border-gold/45 bg-card p-4 text-center shadow-2xl">
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
