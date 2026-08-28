import Image from 'next/image'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { NetworkStatus } from '@/components/network-status'

export function SiteHero() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b border-border/40 px-4 py-4 sm:px-6 sm:py-5">
      <a href="#reading-table" aria-label="Ledgerborn home">
        <Image
          src="/images/ledgerborn-symbol.png"
          alt=""
          width={96}
          height={82}
          className="h-14 w-16 object-contain drop-shadow-[0_8px_18px_oklch(0.04_0.02_225/0.8)] sm:h-16 sm:w-20"
          priority
        />
      </a>
      <div className="flex items-center gap-2 sm:gap-3">
        <NetworkStatus />
        <ConnectWalletButton />
      </div>
    </header>
  )
}
