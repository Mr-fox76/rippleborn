import Image from 'next/image'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative z-20 border-b border-border/40">
      <div
        role="alert"
        className="border-b border-gold/35 bg-gold/10 px-4 py-2 text-center font-mono text-xs font-semibold uppercase tracking-[0.12em] text-gold sm:px-6"
      >
        Testnet mode — do not send real XRP. Real XRP sent here will be lost.
      </div>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <a href="#reading-table" aria-label="Ledgerborn home" className="group inline-flex shrink-0 items-center gap-3">
          <Image
            src="/images/ledgerborn-symbol.png"
            alt=""
            width={96}
            height={82}
            className="h-14 w-16 object-contain drop-shadow-[0_8px_18px_oklch(0.04_0.02_225/0.8)] transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-16 sm:w-20"
            priority
          />
          <span className="hidden flex-col sm:flex">
            <span className="font-sans text-lg font-semibold tracking-[0.08em] text-foreground">LEDGERBORN</span>
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-muted-foreground">Collectibles on XRPL</span>
          </span>
        </a>
        <ConnectWalletButton />
      </div>
    </header>
  )
}
