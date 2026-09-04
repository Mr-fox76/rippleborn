import Link from 'next/link'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
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
          <Link href="/" prefetch={true} aria-label="Ledgerborn home" className="site-brand group inline-flex shrink-0 items-center">
            <img
              src="/ledgerborn-logo.jpg"
              alt="Ledgerborn"
              width={160}
              height={40}
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <div className="hidden md:block">
            <SiteNavigation />
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2">
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
