import Link from 'next/link'
import { Aperture, CircuitBoard, Sparkles } from 'lucide-react'
import { PACK_CATALOG, type PackCatalogEntry } from '@/lib/pack-catalog'

const SET_SYMBOLS: Record<PackCatalogEntry['theme']['id'], typeof Sparkles> = {
  mythic: Sparkles,
  cyborg: CircuitBoard,
  chromatic: Aperture,
}

function SetTitle({ name }: { name: string }) {
  const [brand] = name.split(' - ')

  return (
    <h2 className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground sm:text-base">
      {brand}
    </h2>
  )
}

export function PackGallery() {
  return (
    <section aria-labelledby="pack-gallery-title" className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
        <p className="collection-eyebrow font-mono text-[0.65rem] uppercase tracking-[0.32em] text-foreground">Choose your collection</p>
        <h1 id="pack-gallery-title" className="font-sans text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
          Open a world. <span className="text-muted-foreground">Own what you reveal.</span>
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
            aria-label={`View the ${pack.kicker} collection`}
            className={`pack-set-card pack-set-card-${pack.theme.id} group relative flex min-h-72 items-center justify-center overflow-hidden border p-8 shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-80 lg:min-h-96`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="pack-set-accent mb-6 inline-flex size-20 rotate-45 items-center justify-center rounded-sm border border-current/40 bg-background/30 shadow-[0_0_24px_currentColor] transition-transform duration-300 group-hover:rotate-[55deg] group-hover:scale-105" aria-hidden="true">
                <SetSymbol className="size-10 -rotate-45" strokeWidth={1.5} />
              </span>
              <p className="pack-set-accent font-sans text-3xl font-semibold uppercase tracking-tight sm:text-4xl">{pack.kicker}</p>
              <SetTitle name={pack.name} />
              <span className="mt-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                View collection
              </span>
            </div>
          </Link>
          )
        })}
      </div>
    </section>
  )
}
