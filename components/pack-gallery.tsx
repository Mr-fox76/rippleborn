import Link from 'next/link'
import { Aperture, ArrowUpRight, CircuitBoard, Layers3, Sparkles, WalletCards } from 'lucide-react'
import { PACK_CATALOG, type PackCatalogEntry } from '@/lib/pack-catalog'

const SET_SYMBOLS: Record<PackCatalogEntry['theme']['id'], typeof Sparkles> = {
  mythic: Sparkles,
  cyborg: CircuitBoard,
  chromatic: Aperture,
}

function SetTitle({ name }: { name: string }) {
  const [brand, setName] = name.split(' - ')

  return (
    <h2 className="flex flex-col items-center gap-1 text-foreground">
      <span className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground sm:text-base">
        {brand}
      </span>
      <span className="font-sans text-3xl font-semibold tracking-tight">{setName}</span>
    </h2>
  )
}

export function PackGallery() {
  return (
    <section aria-labelledby="pack-gallery-title" className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
        <p className="collection-eyebrow font-mono text-[0.65rem] uppercase tracking-[0.32em] text-gold">Choose your collection</p>
        <h1 id="pack-gallery-title" className="font-sans text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
          Open a world. <span className="text-gold">Own what you reveal.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every pack contains three collectible cards with real rarity and optional XRP Ledger ownership. Select a set to begin its opening ritual.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {PACK_CATALOG.map((pack) => {
          const SetSymbol = SET_SYMBOLS[pack.theme.id]

          return (
          <Link
            key={pack.id}
            href={pack.href}
            className={`pack-set-card pack-set-card-${pack.theme.id} group flex min-h-96 flex-col justify-between overflow-hidden border p-6 shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8 lg:min-h-[27rem]`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="foil-pack-sigil scale-110 transition-transform duration-300 group-hover:scale-125" aria-hidden="true">
                <span />
              </span>
              <ArrowUpRight className="pack-set-accent size-5 text-muted-foreground transition-colors" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-5 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="pack-set-accent mb-5 -translate-y-2 inline-flex size-16 rotate-45 items-center justify-center rounded-sm border border-current/40 bg-background/30 shadow-[0_0_24px_currentColor] transition-transform duration-300 group-hover:rotate-[55deg]" aria-hidden="true">
                  <SetSymbol className="size-8 -rotate-45" strokeWidth={1.5} />
                </span>
                <p className="pack-set-accent font-mono text-[0.65rem] uppercase tracking-[0.24em]">{pack.kicker}</p>
                <SetTitle name={pack.name} />
                <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">{pack.description}</p>
              </div>

              <dl className="grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <dt className="text-xs text-muted-foreground">Set size</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.cardCount} cards</dd>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <dt className="text-xs text-muted-foreground">Inside</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.cardsPerPack} cards</dd>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <dt className="text-xs text-muted-foreground">Price</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{pack.priceXrp} XRP</dd>
                </div>
              </dl>

              <span className="pack-set-accent inline-flex items-center justify-between gap-4 font-mono text-xs font-semibold uppercase tracking-[0.16em]">
                <span className="inline-flex items-center gap-2"><WalletCards className="size-4" aria-hidden="true" />Open pack</span>
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Layers3 className="size-4" aria-hidden="true" />Five rarities</span>
              </span>
            </div>
          </Link>
          )
        })}
      </div>
    </section>
  )
}
