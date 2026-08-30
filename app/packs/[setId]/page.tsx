import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { NetworkStatus } from '@/components/network-status'
import { NftRecoveryPanel } from '@/components/nft-recovery-panel'
import { PackShop } from '@/components/pack-shop'
import { getPack, PACK_CATALOG } from '@/lib/pack-catalog'
import { EMPTY_COLLECTION_STATS, getCollectionStats } from '@/lib/pack-results'
import { getPhoenixSupply, PHOENIX_CAP_PER_COLLECTION } from '@/lib/phoenix-supply'

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

  const [collectionStats, phoenixSupply] = await Promise.all([
    getCollectionStats(pack.id).catch(() => EMPTY_COLLECTION_STATS),
    getPhoenixSupply(pack.id).catch(() => ({
      minted: 0,
      remaining: PHOENIX_CAP_PER_COLLECTION,
      soldOut: false,
    })),
  ])

  return (
    <div className={`table-surface pack-theme pack-theme-${pack.theme.id} flex min-h-svh flex-col`}>
        <div aria-hidden="true" className="pack-theme-atmosphere" />
        <header className="pack-theme-bar relative z-[100] border-b px-4 py-3 sm:px-6">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Link href="/" className="inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">All packs</span>
            </Link>
            <Link href="/" aria-label="Ledgerborn home" className="inline-flex items-center gap-2">
              <Image src="/images/ledgerborn-symbol.png" alt="" width={48} height={42} className="h-9 w-10 object-contain" />
              <span className="hidden font-sans text-sm font-semibold tracking-[0.12em] text-foreground sm:inline">LEDGERBORN</span>
            </Link>
            <div className="flex items-center justify-end gap-3 sm:gap-5">
              <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.24em] text-gold lg:block">
                {pack.kicker}
              </p>
              <ConnectWalletButton />
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <NftRecoveryPanel />
          <PackShop collectionStats={collectionStats} pack={pack} phoenixSupply={phoenixSupply} />
        </main>

        <footer className="pack-theme-bar relative z-10 flex flex-col items-center gap-3 border-t px-6 py-6 text-center">
          <NetworkStatus />
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            {pack.cardsPerPack} cards · {pack.priceXrp} XRP · {pack.cardCount} to collect
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
