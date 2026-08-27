import Image from 'next/image'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <a href="#reading-table" aria-label="Rippleborn home">
        <Image
          src="/images/rippleborn-logo.png"
          alt=""
          width={72}
          height={72}
          className="size-16 rounded-full object-cover ring-1 ring-gold/60 sm:size-20"
          priority
        />
      </a>
      <ConnectWalletButton />
    </header>
  )
}
