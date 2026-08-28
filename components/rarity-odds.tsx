import type { CollectionStats } from '@/lib/pack-results'

export function RarityOdds({ stats }: { stats: CollectionStats }) {
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

    </section>
  )
}
