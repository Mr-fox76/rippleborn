import type { CollectionStats } from '@/lib/pack-results'
import { CYBORG_COWBOY_POOL } from '@/lib/cyborg-cowboy'
import { CARD_POOL, RARITIES, type PackSetId } from '@/lib/rippleborn'

export function RarityOdds({ stats, setId = 'ledgerborn' }: { stats: CollectionStats; setId?: PackSetId }) {
  const pool = setId === 'cyborg-cowboy' ? CYBORG_COWBOY_POOL : CARD_POOL
  const categoryCounts = RARITIES.map((rarity) => ({
    label: rarity,
    count: pool[rarity].length + (setId === 'ledgerborn' && rarity === 'Mythic' ? 1 : 0),
  }))
  const totalCards = categoryCounts.reduce((total, category) => total + category.count, 0)

  const counters = [
    { label: 'Packs opened', value: stats.packsOpened, className: 'text-foreground' },
    { label: 'Legendary', value: stats.legendaryFound, className: 'rarity-legendary' },
    { label: 'Mythic', value: stats.mythicFound, className: 'rarity-mythic' },
    { label: 'Limited', value: stats.limitedFound, className: 'rarity-limited' },
  ]

  return (
    <section aria-label="Card categories" className="flex flex-col gap-5">
      <dl aria-label="Global collection totals" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counters.map((counter) => (
          <div key={counter.label} className="rounded-lg border border-border bg-card/55 p-3 text-center">
            <dd className={`font-mono text-xl font-semibold tabular-nums ${counter.className}`}>
              {counter.value.toLocaleString()}
            </dd>
            <dt className="mt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              {counter.label}
            </dt>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
            Cards to collect
          </h2>
          <p className="font-mono text-sm font-semibold text-gold">{totalCards} card set</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
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
          {setId === 'ledgerborn'
            ? 'Includes The Phoenix, a five-edition limited Mythic card.'
            : 'Twenty-one unique frontier characters across five collectible rarities.'}
        </p>
      </div>
    </section>
  )
}
