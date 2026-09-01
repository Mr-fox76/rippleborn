import Link from 'next/link'
import { IssuerTrustNotice } from '@/components/issuer-trust-notice'
import { PackGallery } from '@/components/pack-gallery'
import { RarityOdds } from '@/components/rarity-odds'
import { EMPTY_COLLECTION_STATS, getCollectionStats, getLatestMintedNfts } from '@/lib/pack-results'
import { incrementHomepageVisits } from '@/lib/site-counter'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [collectionStats, visitCount, latestNfts] = await Promise.all([
    getCollectionStats().catch(() => EMPTY_COLLECTION_STATS),
    incrementHomepageVisits(),
    getLatestMintedNfts(4).catch(() => []),
  ])

  return (
    <>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <PackGallery />
        <section aria-labelledby="collection-totals-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-3">
          <h2 id="collection-totals-heading" className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The collection taking shape, one reveal at a time
          </h2>
          <RarityOdds stats={collectionStats} countersOnly visitCount={visitCount} />
        </section>
        <IssuerTrustNotice latestNfts={latestNfts} />
      </main>
      <footer className="relative z-10 border-t border-border/40 px-6 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="text-sm leading-relaxed text-foreground/80">
              Independent project. Not affiliated with Ledger or Xaman.
            </p>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              3 cards · 5 XRP · Version 4.2
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm md:justify-end">
            <Link href="/help" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Help</Link>
            <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
