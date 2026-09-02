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
          <Link href="/" aria-label="Ledgerborn home" className="site-brand group inline-flex shrink-0 items-center gap-3">
            <Image
              src="/images/ledgerborn-logo.jpg"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-md object-cover"
              priority
            />
            <span className="hidden items-baseline gap-2 min-[440px]:flex">
              <span className="font-sans text-sm font-medium tracking-[0.16em] text-foreground sm:text-[0.95rem]">LEDGERBORN</span>
              <span className="site-brand-divider" aria-hidden="true" />
              <span className="font-mono text-[0.48rem] uppercase tracking-[0.18em] text-muted-foreground">XRPL</span>
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
