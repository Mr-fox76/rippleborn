import type { CollectionStats } from '@/lib/pack-results'
import { CHROMATIC_ABYSS_POOL } from '@/lib/chromatic-abyss'
import { CYBORG_COWBOY_POOL } from '@/lib/cyborg-cowboy'
import { CARD_POOL, RARITIES, type PackSetId } from '@/lib/rippleborn'

export function RarityOdds({
  stats,
  setId = 'ledgerborn',
  countersOnly = false,
}: {
  stats: CollectionStats
  setId?: PackSetId
  countersOnly?: boolean
}) {
  const pool =
    setId === 'cyborg-cowboy'
      ? CYBORG_COWBOY_POOL
      : setId === 'chromatic-abyss'
        ? CHROMATIC_ABYSS_POOL
        : CARD_POOL
  const categoryCounts = RARITIES.map((rarity) => ({
    label: rarity,
    count: pool[rarity].length,
  }))
  const totalCards = categoryCounts.reduce((total, category) => total + category.count, 0)

  const counters = [
    { label: 'Packs opened', value: stats.packsOpened, className: 'text-foreground' },
    { label: 'Rare', value: stats.rareFound, className: 'rarity-rare' },
    { label: 'Epic', value: stats.epicFound, className: 'rarity-epic' },
    { label: 'Legendary', value: stats.legendaryFound, className: 'rarity-legendary' },
    { label: 'Mythic', value: stats.mythicFound, className: 'rarity-mythic' },
    { label: 'The Phoenix', value: stats.phoenixFound, className: 'text-phoenix', featured: true },
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
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
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

      <p className="text-center text-sm font-medium leading-relaxed text-phoenix">
        Hunt The Phoenix — this collection closes when its third Phoenix is successfully minted.
      </p>

      {!countersOnly ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
              Cards to collect
            </h2>
            <p className="font-mono text-sm font-semibold text-gold">{totalCards} card set</p>
          </div>
          <dl className={`grid grid-cols-2 gap-2 ${setId === 'ledgerborn' ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-5'}`}>
            {categoryCounts.map((category) => (
              <div
                key={category.label}
                className={`collection-category rarity-${category.label.toLowerCase()} border px-3 py-2 text-center`}
              >
                <dd className="font-mono text-lg font-semibold tabular-nums">{category.count}</dd>
                <dt className="text-[0.65rem] font-medium uppercase tracking-wider">{category.label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Includes The Phoenix as a Mythic discovery. A maximum of three can be successfully minted from this collection.
          </p>
        </div>
      ) : null}
    </section>
  )
}
