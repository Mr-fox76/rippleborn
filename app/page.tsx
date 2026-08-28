import { NetworkStatus } from '@/components/network-status'
import { PackShop } from '@/components/pack-shop'
import { SiteHero } from '@/components/site-hero'
import { XamanWalletProvider } from '@/components/xaman-wallet-provider'

export default function Page() {
  return (
    <XamanWalletProvider>
      <div className="table-surface flex min-h-svh flex-col">
      <SiteHero />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-10">
        <PackShop />
      </main>
      <footer className="relative z-10 flex flex-col items-center gap-3 px-6 py-5 text-center sm:flex-row sm:justify-center">
        <NetworkStatus />
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          3 cards · 5 XRP
        </p>
      </footer>
      </div>
    </XamanWalletProvider>
  )
}
