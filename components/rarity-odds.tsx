import type { Rarity } from '@/lib/rippleborn'

const CATEGORIES: Array<{ name: Rarity; description: string; className: string }> = [
  { name: 'Common', description: 'Foundational cards from the Rippleborn world.', className: 'rarity-common' },
  { name: 'Rare', description: 'Distinctive characters with stronger collectible appeal.', className: 'rarity-rare' },
  { name: 'Epic', description: 'Striking artwork reserved for exceptional pulls.', className: 'rarity-epic' },
  { name: 'Legendary', description: 'Prestige cards featuring the collection’s icons.', className: 'rarity-legendary' },
  { name: 'Mythic', description: 'The highest tier of standard Rippleborn cards.', className: 'rarity-mythic' },
]

export function RarityOdds() {
  return (
    <section aria-label="Card categories" className="flex flex-col gap-5">
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
