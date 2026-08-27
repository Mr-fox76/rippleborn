import Image from 'next/image'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <a
        href="#reading-table"
        className="flex items-center gap-3 font-sans text-lg font-semibold tracking-[0.12em] text-foreground uppercase"
      >
        <Image
          src="/images/rippleborn-logo.png"
          alt=""
          width={52}
          height={52}
          className="size-12 rounded-full object-cover ring-1 ring-gold/60"
          priority
        />
        <span>Rippleborn</span>
      </a>
      <ConnectWalletButton />
    </header>
  )
}
