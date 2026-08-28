import { NetworkStatus } from '@/components/network-status'
import { PackShop } from '@/components/pack-shop'
import { SiteHero } from '@/components/site-hero'
import { XamanWalletProvider } from '@/components/xaman-wallet-provider'
import { EMPTY_COLLECTION_STATS, getCollectionStats } from '@/lib/pack-results'
import { incrementHomepageVisits } from '@/lib/site-counter'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [collectionStats, visitCount] = await Promise.all([
    getCollectionStats().catch(() => EMPTY_COLLECTION_STATS),
    incrementHomepageVisits(),
  ])

  return (
    <XamanWalletProvider>
      <div className="table-surface flex min-h-svh flex-col">
      <SiteHero />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-14">
        <PackShop collectionStats={collectionStats} />
      </main>
      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border/40 px-6 py-6 text-center">
        <NetworkStatus />
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          <p>3 cards · 5 XRP</p>
          {visitCount !== null ? (
            <p aria-label={`${visitCount.toLocaleString('en-GB')} site visits`}>
              Site visits · {visitCount.toLocaleString('en-GB')}
            </p>
          ) : null}
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ledgerborn is an independent company and is not affiliated with, endorsed by, or sponsored by Ripple. Ledgerborn uses the open-source XRP Ledger technology.
        </p>
      </footer>
      </div>
    </XamanWalletProvider>
  )
}
