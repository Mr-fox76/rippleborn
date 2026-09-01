import Image from 'next/image'
import Link from 'next/link'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { NetworkStatus } from '@/components/network-status'

export function SiteHero() {
  return (
    <header className="sticky top-0 z-[100] border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div
        role="alert"
        className="border-b border-border/60 bg-card/70 px-4 py-2 text-center font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-6"
      >
        Mainnet — pack payments use real XRP and are irreversible. Verify the amount and destination in Xaman before signing.
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-5">
        <Link href="/" aria-label="Ledgerborn home" className="group inline-flex min-w-0 shrink-0 items-center gap-3">
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
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden min-[430px]:block">
            <NetworkStatus />
          </div>
          <Link
            href="/collection"
            className="ghost-action inline-flex min-h-9 items-center border border-border/70 px-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground sm:min-h-10 sm:px-4 sm:text-xs"
          >
            Collection
          </Link>
          <ConnectWalletButton />
        </div>
        <div className="flex w-full justify-end min-[430px]:hidden">
          <NetworkStatus />
        </div>
      </div>
    </header>
  )
}
