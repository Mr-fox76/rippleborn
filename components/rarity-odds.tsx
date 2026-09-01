import type { CollectionStats } from '@/lib/pack-results'
import { CHROMATIC_ABYSS_POOL } from '@/lib/chromatic-abyss'
import { CYBORG_COWBOY_POOL } from '@/lib/cyborg-cowboy'
import { CARD_POOL, RARITIES, SHARED_RARITY_ODDS, type PackSetId } from '@/lib/rippleborn'

export function RarityOdds({
  stats,
  setId = 'ledgerborn',
  countersOnly = false,
  visitCount,
}: {
  stats: CollectionStats
  setId?: PackSetId
  countersOnly?: boolean
  visitCount?: number | bigint | null
}) {
  const pool =
    setId === 'cyborg-cowboy'
      ? CYBORG_COWBOY_POOL
      : setId === 'chromatic-abyss'
        ? CHROMATIC_ABYSS_POOL
        : CARD_POOL
  const categoryCounts = RARITIES.map((rarity) => ({
    rarity,
    count: pool[rarity].length,
  }))
  const totalCards = categoryCounts.reduce((total, category) => total + category.count, 0)

  const counters = [
    { label: 'Packs opened', value: stats.packsOpened, className: 'text-foreground' },
    ...(countersOnly && visitCount !== null && visitCount !== undefined
      ? [{ label: 'Site visits', value: visitCount, className: 'text-foreground' }]
      : []),
    { label: 'Rare', value: stats.rareFound, className: 'rarity-rare' },
    { label: 'Epic', value: stats.epicFound, className: 'rarity-epic' },
    { label: 'Legendary', value: stats.legendaryFound, className: 'rarity-legendary' },
    { label: 'Mythic', value: stats.mythicFound, className: 'rarity-mythic' },
    { label: 'Phoenix', value: stats.phoenixFound, className: 'rarity-phoenix', featured: true },
  ]

  return (
    <section aria-label={countersOnly ? 'Cards discovered from opened packs' : 'Card categories'} className="flex flex-col gap-5">
      {!countersOnly ? (
        <h2 className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Cards discovered from opened packs in this collection
        </h2>
      ) : null}
      <dl
        aria-label={countersOnly ? 'Cards discovered from opened packs across all sets' : 'Cards discovered from opened packs in this set'}
        className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${countersOnly && visitCount !== null && visitCount !== undefined ? 'lg:grid-cols-7' : 'lg:grid-cols-6'}`}
      >
        {counters.map((counter) => (
          <div
            key={counter.label}
            className={`rounded-lg border p-3 text-center ${counter.featured ? 'border-phoenix bg-phoenix/10 shadow-[0_0_20px_color-mix(in_oklch,var(--phoenix)_20%,transparent)]' : 'border-border bg-card/55'}`}
          >
            <dd
              className={`font-mono text-xl font-semibold tabular-nums ${counter.className}`}
              style={counter.className.startsWith('rarity-') ? { color: 'var(--rarity-color)' } : undefined}
            >
              {counter.value.toLocaleString()}
            </dd>
            <dt
              className={`mt-1 text-[0.7rem] font-medium uppercase tracking-wider ${counter.className.startsWith('rarity-') ? counter.className : 'text-muted-foreground'}`}
              style={counter.className.startsWith('rarity-') ? { color: 'var(--rarity-color)' } : undefined}
            >
              {counter.label}
            </dt>
          </div>
        ))}
      </dl>

      {countersOnly ? (
        <p className="text-center text-sm font-medium leading-relaxed text-phoenix">
          Phoenix is the rarest pull: a 0.05% independent chance per card.
        </p>
      ) : (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                Collection guide
              </h2>
              <p className="text-xs text-muted-foreground">Independent odds for each card position</p>
            </div>
            <p className="shrink-0 font-mono text-sm font-semibold text-gold">{totalCards} cards</p>
          </div>

          <div role="table" aria-label="Collection rarity odds and card counts" className="border-y border-border">
            <div role="row" className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border py-2 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(10rem,1fr)_8rem_8rem]">
              <span role="columnheader">Rarity</span>
              <span role="columnheader" className="text-right">Pull chance</span>
              <span role="columnheader" className="text-right">In set</span>
            </div>
            {categoryCounts.map((category) => {
              const rarityClass = `rarity-${category.rarity.toLowerCase()}`
              return (
                <div
                  key={category.rarity}
                  role="row"
                  className={`${rarityClass} grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[minmax(10rem,1fr)_8rem_8rem]`}
                  style={{ color: 'var(--rarity-color)' }}
                >
                  <span role="cell" className="flex items-center gap-3 font-medium">
                    <span className="size-2 shrink-0 rotate-45 bg-current" aria-hidden="true" />
                    {category.rarity}
                  </span>
                  <span role="cell" className="text-right font-mono font-semibold tabular-nums">
                    {SHARED_RARITY_ODDS[category.rarity]}%
                  </span>
                  <span role="cell" className="text-right font-mono font-semibold tabular-nums">
                    {category.count}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="text-pretty text-center text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-phoenix">Phoenix is the highest rarity tier.</span>{' '}
            Every card position has an independent 0.05% chance to reveal The Phoenix.
          </p>
        </div>
      )}
    </section>
  )
}
