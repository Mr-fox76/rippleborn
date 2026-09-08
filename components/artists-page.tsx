import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'

const ARTIST_MAILTO = 'mailto:main@ledgerborn.app?subject=Ledgerborn artist set'

const splitColumns = [
  {
    label: 'You get',
    items: [
      'Your own set page',
      'A cut of each pack',
      '5% on-chain when a card is resold, paid to your Xaman wallet',
    ],
  },
  {
    label: 'I handle',
    items: ['Rarity, framing, pack page, mint, claim'],
  },
  {
    label: 'You handle',
    items: ['The art', 'One wallet you keep'],
  },
]

export function ArtistsPage() {
  return (
    <div className="table-surface flex min-h-svh flex-col">
      <header className="relative z-10 border-b border-border/40 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Pack store
          </Link>
          <Link href="/" aria-label="Ledgerborn home" className="inline-flex items-center gap-2">
            <span className="site-brand-mark" aria-hidden="true">
              <span className="site-brand-glyph">L</span>
            </span>
            <span className="hidden font-sans text-sm font-semibold tracking-[0.12em] text-foreground sm:inline">LEDGERBORN</span>
          </Link>
          <div className="flex items-center gap-3">
            <SiteNavigation />
            <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold sm:block">Artists</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
        <section aria-labelledby="artists-heading" className="flex flex-col gap-5 border-b border-border/40 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold">Ledgerborn</p>
          <h1 id="artists-heading" className="max-w-3xl font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Artists
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ledgerborn is a small card project on the XRP Ledger. A set is about 20&ndash;22 portraits. People open three cards for 5 XRP.
          </p>
        </section>

        <div className="grid gap-8 sm:grid-cols-3">
          {splitColumns.map((column) => (
            <section key={column.label} className="flex flex-col gap-4 border-t border-border/50 pt-5">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{column.label}</h2>
              <ul className="flex flex-col gap-3">
                {column.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-foreground sm:text-base">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="flex flex-col items-start gap-6 border border-primary/30 bg-card/45 p-6 sm:p-8">
          <p className="max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
            Not looking for a big drop. One set at a time.
          </p>
          <a
            href={ARTIST_MAILTO}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-sans text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            Start a set
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/40 px-6 py-6">
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Store</Link>
          <Link href="/help" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Help</Link>
          <Link href="/artists" aria-current="page" className="text-foreground underline-offset-4">Artists</Link>
          <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy policy</Link>
          <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms &amp; conditions</Link>
        </nav>
      </footer>
    </div>
  )
}
