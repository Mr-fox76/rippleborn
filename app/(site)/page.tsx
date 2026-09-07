import Link from 'next/link'
import { FreePackBanner } from '@/components/free-pack-banner'
import { IssuerTrustNotice } from '@/components/issuer-trust-notice'
import { NetworkStatus } from '@/components/network-status'
import { PackWorkspace } from '@/components/pack-workspace'
import { RarityOdds } from '@/components/rarity-odds'
import { EMPTY_COLLECTION_STATS, getCollectionStats, getLatestMintedNfts } from '@/lib/pack-results'
import type { CollectionStats } from '@/lib/pack-results'
import { incrementHomepageVisits } from '@/lib/site-counter'
import type { PackSetId } from '@/lib/rippleborn'

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>
}) {
  const { set } = await searchParams

  // Fetch every set's live stats up front so nothing renders as a zero placeholder while loading.
  const [mythic, cyborg, chromatic, allSets, visitCount, latestNfts] = await Promise.all([
    getCollectionStats('ledgerborn').catch(() => EMPTY_COLLECTION_STATS),
    getCollectionStats('cyborg-cowboy').catch(() => EMPTY_COLLECTION_STATS),
    getCollectionStats('chromatic-abyss').catch(() => EMPTY_COLLECTION_STATS),
    getCollectionStats().catch(() => EMPTY_COLLECTION_STATS),
    incrementHomepageVisits().catch(() => 0),
    getLatestMintedNfts(4).catch(() => []),
  ])

  const statsBySet: Record<PackSetId, CollectionStats> = {
    ledgerborn: mythic,
    'cyborg-cowboy': cyborg,
    'chromatic-abyss': chromatic,
  }

  return (
    <>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <FreePackBanner />
        <PackWorkspace statsBySet={statsBySet} initialSlug={set} />
        <section aria-labelledby="all-sets-heading" className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <h2 id="all-sets-heading" className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            All sets
          </h2>
          <RarityOdds stats={allSets} countersOnly visitCount={visitCount} />
        </section>
        <IssuerTrustNotice latestNfts={latestNfts} />
      </main>
      <footer className="relative z-10 border-t border-border/40 px-6 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="text-sm leading-relaxed text-foreground/80">
              Not affiliated with Ledger or Xaman.
            </p>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              3 cards · 5 XRP · Version 4.2
            </p>
            <div className="flex justify-center md:justify-start">
              <NetworkStatus />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 md:items-end">
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm md:justify-end">
              <Link href="/help" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Help</Link>
              <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms</Link>
            </nav>
            <div className="flex items-center justify-center gap-3 md:justify-end">
              <a
                href="https://x.com/Ledger_Born"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Ledgerborn on X"
                title="X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
                </svg>
              </a>
              <a
                href="https://t.me/LedgerBorn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Telegram group"
                title="Telegram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M21.944 4.667a1.5 1.5 0 0 0-1.53-.253L3.36 11.02c-.98.38-.97 1.77.014 2.14l4.26 1.598 1.65 5.303c.2.64 1.01.84 1.49.37l2.37-2.32 4.44 3.26c.56.41 1.36.11 1.51-.57l3.24-15.02a1.5 1.5 0 0 0-.84-1.812ZM9.9 14.44l8.06-5.02c.16-.1.33.12.19.25l-6.63 6.02a.9.9 0 0 0-.28.53l-.24 1.77c-.03.2-.31.23-.38.04l-.86-2.83a.6.6 0 0 1 .24-.68Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
