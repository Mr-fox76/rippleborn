import Link from 'next/link'
import { IssuerTrustNotice } from '@/components/issuer-trust-notice'
import { PackGallery } from '@/components/pack-gallery'
import { RarityOdds } from '@/components/rarity-odds'
import { SiteHero } from '@/components/site-hero'
import { EMPTY_COLLECTION_STATS, getCollectionStats, getLatestMintedNfts } from '@/lib/pack-results'
import { incrementHomepageVisits } from '@/lib/site-counter'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [collectionStats, visitCount, latestNfts] = await Promise.all([
    getCollectionStats().catch(() => EMPTY_COLLECTION_STATS),
    incrementHomepageVisits(),
    getLatestMintedNfts().catch(() => []),
  ])

  return (
    <div className="homepage-monochrome table-surface flex min-h-svh flex-col">
      <SiteHero />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <PackGallery />
        <IssuerTrustNotice latestNfts={latestNfts} />
        <section aria-labelledby="collection-totals-heading" className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <h2 id="collection-totals-heading" className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Cards discovered from opened packs
          </h2>
          <RarityOdds stats={collectionStats} countersOnly />
        </section>
      </main>
      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border/40 px-6 py-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          <p>3 cards · 5 XRP</p>
          {visitCount !== null ? (
            <p aria-label={`${visitCount.toLocaleString('en-GB')} site visits`}>
              Site visits · {visitCount.toLocaleString('en-GB')}
            </p>
          ) : null}
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Independent project. Not affiliated with Ledger or Xaman. Ledgerborn uses the open-source XRP Ledger technology.
        </p>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/help" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Help</Link>
          <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy policy</Link>
          <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms &amp; conditions</Link>
        </nav>
      </footer>
    </div>
  )
}
