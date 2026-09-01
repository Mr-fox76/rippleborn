import Image from 'next/image'
import Link from 'next/link'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { NetworkStatus } from '@/components/network-status'
import { SiteNavigation } from '@/components/site-navigation'

export function SiteHero() {
  return (
    <header className="site-header sticky top-0 z-[100]">
      <div role="alert" className="site-safety-ribbon">
        <span className="site-safety-dot" aria-hidden="true" />
        <span><strong>Mainnet:</strong> payments use real XRP. Verify in Xaman before signing.</span>
      </div>
      <div className="site-header-bar">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Ledgerborn home" className="site-brand group inline-flex shrink-0 items-center gap-2.5">
            <Image
              src="/images/ledgerborn-symbol.png"
              alt=""
              width={56}
              height={48}
              className="site-brand-mark size-10 object-contain transition-transform duration-300 group-hover:-translate-y-0.5 sm:size-11"
              priority
            />
            <span className="hidden flex-col min-[440px]:flex">
              <span className="font-sans text-sm font-semibold tracking-[0.13em] text-foreground sm:text-[0.95rem]">LEDGERBORN</span>
              <span className="font-mono text-[0.48rem] uppercase tracking-[0.22em] text-muted-foreground">XRPL collectibles</span>
            </span>
          </Link>

          <div className="hidden md:block">
            <SiteNavigation />
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="hidden lg:block">
              <NetworkStatus />
            </div>
            <div className="md:hidden">
              <SiteNavigation />
            </div>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
