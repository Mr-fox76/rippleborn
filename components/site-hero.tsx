import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <a
        href="#reading-table"
        className="font-sans text-lg font-semibold tracking-[0.12em] text-foreground uppercase"
      >
        Rippleborn
      </a>
      <ConnectWalletButton />
    </header>
  )
}
