import type { CollectionStats } from '@/lib/pack-results'
import type { Rarity } from '@/lib/rippleborn'

const CATEGORIES: Array<{ name: Rarity; description: string; className: string }> = [
  { name: 'Common', description: 'Foundational cards from the Rippleborn world.', className: 'rarity-common' },
  { name: 'Rare', description: 'Distinctive characters with stronger collectible appeal.', className: 'rarity-rare' },
  { name: 'Epic', description: 'Striking artwork reserved for exceptional pulls.', className: 'rarity-epic' },
  { name: 'Legendary', description: 'Prestige cards featuring the collection’s icons.', className: 'rarity-legendary' },
  { name: 'Mythic', description: 'The highest tier of standard Rippleborn cards.', className: 'rarity-mythic' },
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

      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Discover every category
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          Every pack contains three collectible cards drawn from the Rippleborn collection.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {CATEGORIES.map((category) => (
          <li
            key={category.name}
            className={`${category.className} rarity-badge rounded-lg border p-3`}
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
              {category.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              {category.description}
            </p>
          </li>
        ))}
      </ul>

      <div className="rarity-limited rarity-badge rounded-lg border p-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
          Limited Phoenix editions
        </p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          Five individually numbered Phoenix cards crown the collection, available only while their
          editions remain unclaimed.
        </p>
      </div>
    </section>
  )
}
