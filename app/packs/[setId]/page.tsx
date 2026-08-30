import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { NetworkStatus } from '@/components/network-status'
import { NftRecoveryPanel } from '@/components/nft-recovery-panel'
import { PackShop } from '@/components/pack-shop'
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
    <div className={`table-surface pack-theme pack-theme-${pack.theme.id} flex min-h-svh flex-col`}>
        <div aria-hidden="true" className="pack-theme-atmosphere" />
        <header className="pack-theme-bar relative z-10 flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All packs
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.24em] text-gold md:block">
              {pack.kicker}
            </p>
            <ConnectWalletButton />
          </div>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <NftRecoveryPanel />
          <PackShop collectionStats={collectionStats} pack={pack} />
        </main>

        <footer className="pack-theme-bar relative z-10 flex flex-col items-center gap-3 border-t px-6 py-6 text-center">
          <NetworkStatus />
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            {pack.cardsPerPack} cards · {pack.priceXrp} XRP · {pack.cardCount} to collect
          </p>
        </footer>
    </div>
  )
}
