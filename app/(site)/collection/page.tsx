import type { Metadata } from 'next'
import Link from 'next/link'
import { WalletCollection } from '@/components/wallet-collection'

export const metadata: Metadata = {
  title: 'Collection | Ledgerborn',
  description: 'View Ledgerborn collectible cards held by your connected XRP Ledger wallet.',
}

export default function CollectionPage() {
  return (
    <>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <WalletCollection />
      </main>
      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border/40 px-6 py-6 text-center">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Independent project. Not affiliated with Ledger or Xaman. Ledgerborn uses the open-source XRP Ledger technology.
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
