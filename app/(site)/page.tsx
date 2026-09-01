import Link from 'next/link'
import { ArtistProgramTeaser } from '@/components/artist-program-teaser'
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
        <IssuerTrustNotice latestNfts={latestNfts} />
        <ArtistProgramTeaser />
        <section aria-labelledby="collection-totals-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-3">
          <h2 id="collection-totals-heading" className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The collection taking shape, one reveal at a time
          </h2>
          <RarityOdds stats={collectionStats} countersOnly visitCount={visitCount} />
        </section>
      </main>
      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border/40 px-6 py-6 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">3 cards · 5 XRP</p>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
Ledgerborn is a new independent project built on open-source XRP Ledger technology. We are not affiliated with Ledger or Xaman, and we encourage every collector to review the details before signing.
        </p>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/help" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Help</Link>
          <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy policy</Link>
          <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms &amp; conditions</Link>
        </nav>
      </footer>
    </>
  )
}
