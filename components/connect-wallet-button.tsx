'use client'

import Image from 'next/image'
import { ChevronDown, ExternalLink, Loader2, LogOut, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-5)}`
}

export function ConnectWalletButton() {
  const { account, request, status, creating, error, connect, disconnect } = useXamanWallet()

  if (account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="wallet-chip inline-flex min-h-10 items-center gap-2 px-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em]"
              aria-label={`Wallet ${shortAddress(account)}. Open wallet menu`}
            />
          }
        >
          <span className="wallet-status-dot" aria-hidden="true" />
          <span className="hidden sm:inline">{shortAddress(account)}</span>
          <span className="sm:hidden">Wallet</span>
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={10} className="wallet-menu w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1 p-2">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-gold">Xaman connected</span>
              <span className="break-all font-mono text-[0.65rem] font-normal leading-relaxed text-foreground">{account}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={disconnect} className="min-h-10 px-2.5 font-mono text-xs uppercase tracking-[0.1em]">
              <LogOut aria-hidden="true" />
              Disconnect wallet
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const pending = creating || status?.status === 'pending'

  return (
    <div className="relative flex items-center">
      <Popover open={Boolean(request)}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              size="sm"
              onClick={connect}
              disabled={pending}
              className="wallet-connect-action primary-action min-h-10 px-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] sm:px-4"
            />
          }
        >
          {pending ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : <Wallet data-icon="inline-start" aria-hidden="true" />}
          <span className="hidden sm:inline">{status?.status === 'pending' ? 'Waiting for Xaman' : 'Connect Xaman'}</span>
          <span className="sm:hidden">{pending ? 'Waiting' : 'Connect'}</span>
        </PopoverTrigger>
        {request ? (
          <PopoverContent align="end" sideOffset={12} className="wallet-connect-popover w-64 p-4">
            <PopoverHeader className="items-center text-center">
              <PopoverTitle className="font-sans text-base">Connect Xaman</PopoverTitle>
              <PopoverDescription className="font-mono text-[0.6rem] uppercase tracking-[0.12em]">Scan or open on this device</PopoverDescription>
            </PopoverHeader>
            <div className="wallet-qr-frame mx-auto p-2">
              <Image src={request.qrUrl} alt="Scan to connect your wallet in Xaman" width={176} height={176} unoptimized />
            </div>
            <Button render={<a href={request.deepLink} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm" className="ghost-action w-full font-mono text-xs uppercase tracking-[0.1em]">
              Open in Xaman
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
            </Button>
          </PopoverContent>
        ) : null}
      </Popover>
      {error ? <p role="alert" className="wallet-error absolute right-0 top-[calc(100%+0.75rem)] w-64 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
