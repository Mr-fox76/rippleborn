import Link from 'next/link'
import { ArrowUpRight, Layers3, WalletCards } from 'lucide-react'
import { PACK_CATALOG } from '@/lib/pack-catalog'

export function PackGallery() {
  return (
    <section aria-labelledby="pack-gallery-title" className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-gold">Choose your collection</p>
        <h1 id="pack-gallery-title" className="font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Open a world. Own what you reveal.
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every pack contains three collectible cards with real rarity and optional XRP Ledger ownership. Select a set to begin its opening ritual.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        {PACK_CATALOG.map((pack) => (
          <Link
            key={pack.id}
            href={pack.href}
            className="group flex min-h-80 flex-col justify-between overflow-hidden border border-border bg-card/80 p-5 shadow-xl transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="foil-pack-sigil scale-110 transition-transform duration-300 group-hover:scale-125" aria-hidden="true">
                <span />
              </span>
              <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-gold">{pack.kicker}</p>
                <h2 className="font-sans text-3xl font-semibold tracking-tight text-foreground">{pack.name}</h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{pack.description}</p>
              </div>

              <dl className="grid grid-cols-3 gap-2 border-y border-border py-4">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">Set size</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.cardCount} cards</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">Inside</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.cardsPerPack} cards</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">Price</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.priceXrp} XRP</dd>
                </div>
              </dl>

              <span className="inline-flex items-center justify-between gap-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="inline-flex items-center gap-2"><WalletCards className="size-4" aria-hidden="true" />Open pack</span>
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Layers3 className="size-4" aria-hidden="true" />Five rarities</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
