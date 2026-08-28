import Image from 'next/image'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b border-border/40 px-4 py-4 sm:px-6 sm:py-5">
      <a href="#reading-table" aria-label="Ledgerborn home">
        <Image
          src="/images/rippleborn-logo.png"
          alt=""
          width={72}
          height={72}
          className="size-16 rounded-full object-cover shadow-xl shadow-background ring-1 ring-gold/45 sm:size-20"
          priority
        />
      </a>
      <ConnectWalletButton />
    </header>
  )
}
