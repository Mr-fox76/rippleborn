import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { NetworkStatus } from '@/components/network-status'
import { PackShop } from '@/components/pack-shop'
import { XamanWalletProvider } from '@/components/xaman-wallet-provider'
import { getPack, PACK_CATALOG } from '@/lib/pack-catalog'
import { EMPTY_COLLECTION_STATS, getCollectionStats } from '@/lib/pack-results'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return PACK_CATALOG.map((pack) => ({ setId: pack.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ setId: string }> }): Promise<Metadata> {
  const { setId } = await params
  const pack = getPack(setId)
  if (!pack) return {}

  return {
    title: `${pack.name} Pack | Ledgerborn`,
    description: `Open a ${pack.name} pack and reveal three collectible XRP Ledger cards.`,
  }
}

export default async function PackPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params
  const pack = getPack(setId)
  if (!pack) notFound()

  const collectionStats = await getCollectionStats(pack.id).catch(() => EMPTY_COLLECTION_STATS)

  return (
    <XamanWalletProvider>
      <div className="table-surface flex min-h-svh flex-col">
        <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border/40 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All packs
          </Link>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-gold">{pack.kicker}</p>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-14">
          <PackShop collectionStats={collectionStats} selectedSet={pack.id} />
        </main>

        <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border/40 px-6 py-6 text-center">
          <NetworkStatus />
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            {pack.cardsPerPack} cards · {pack.priceXrp} XRP · {pack.cardCount} to collect
          </p>
        </footer>
      </div>
    </XamanWalletProvider>
  )
}
