import Image from 'next/image'
import type { Card, Rarity } from '@/lib/rippleborn'

const RARITY_STYLES: Record<Rarity, { text: string; border: string; glow: string }> = {
  Common: {
    text: 'text-rarity-common',
    border: 'border-rarity-common/30',
    glow: 'from-rarity-common/10',
  },
  Rare: {
    text: 'text-rarity-rare',
    border: 'border-rarity-rare/40',
    glow: 'from-rarity-rare/15',
  },
  Epic: {
    text: 'text-rarity-epic',
    border: 'border-rarity-epic/45',
    glow: 'from-rarity-epic/20',
  },
  Legendary: {
    text: 'text-rarity-legendary',
    border: 'border-rarity-legendary/50',
    glow: 'from-rarity-legendary/25',
  },
  Mythic: {
    text: 'text-rarity-mythic',
    border: 'border-rarity-mythic/55',
    glow: 'from-rarity-mythic/30',
  },
}

export function PackResults({ cards }: { cards: Card[] }) {
  return (
    <section aria-label="Cards pulled from your pack" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-lg font-semibold tracking-tight">Your pull</h2>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {cards.length} cards
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const style = RARITY_STYLES[card.rarity]

          return (
            <li
              key={card.id}
              className={`group relative flex flex-col overflow-hidden rounded-lg border bg-card ${style.border}`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                  src={card.image || '/placeholder.svg'}
                  alt={`Illustration of ${card.name}, a ${card.rarity} card`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
                />
                <span className="absolute left-3 top-3 rounded bg-background/80 px-2 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
                  {String(card.slot).padStart(2, '0')}
                </span>
              </div>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent ${style.glow}`}
              />

              <div className="relative flex flex-col gap-1 px-4 py-3">
                <p className="font-sans font-medium leading-snug text-card-foreground text-pretty">
                  {card.name}
                </p>
                <p className={`font-mono text-xs uppercase tracking-[0.18em] ${style.text}`}>
                  {card.rarity}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
