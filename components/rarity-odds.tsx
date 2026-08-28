import type { CollectionStats } from '@/lib/pack-results'
import type { Rarity } from '@/lib/rippleborn'

const CATEGORIES: Array<{ name: Rarity; description: string; className: string }> = [
  { name: 'Common', description: 'Foundational cards from the Ledgerborn world.', className: 'rarity-common' },
  { name: 'Rare', description: 'Distinctive characters with stronger collectible appeal.', className: 'rarity-rare' },
  { name: 'Epic', description: 'Striking artwork reserved for exceptional pulls.', className: 'rarity-epic' },
  { name: 'Legendary', description: 'Prestige cards featuring the collection’s icons.', className: 'rarity-legendary' },
  { name: 'Mythic', description: 'The highest tier of standard Ledgerborn cards.', className: 'rarity-mythic' },
]

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <div
            key={category.name}
            className={`${category.className} rarity-badge rounded-lg border p-3`}
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
              {category.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              {category.description}
            </p>
          </div>
        ))}

        <div className="rarity-limited rarity-badge rounded-lg border p-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
            Limited Phoenix editions
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/70">
            Five individually numbered Phoenix cards crown the collection, available only while their
            editions remain unclaimed.
          </p>
        </div>
      </div>
    </section>
  )
}
