import { RARITIES, SLOT_ODDS, type Rarity } from '@/lib/rippleborn'

const RARITY_TEXT: Record<Rarity, string> = {
  Common: 'text-rarity-common',
  Rare: 'text-rarity-rare',
  Epic: 'text-rarity-epic',
  Legendary: 'text-rarity-legendary',
  Mythic: 'text-rarity-mythic',
}

const RARITY_BAR: Record<Rarity, string> = {
  Common: 'bg-rarity-common',
  Rare: 'bg-rarity-rare',
  Epic: 'bg-rarity-epic',
  Legendary: 'bg-rarity-legendary',
  Mythic: 'bg-rarity-mythic',
}

export function RarityOdds() {
  return (
    <section aria-label="Pack rarity odds" className="flex flex-col gap-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Rarity odds
      </h3>

      <dl className="flex flex-col gap-5">
        {SLOT_ODDS.map((slot) => {
          const entries = RARITIES.filter((r) => slot.odds[r]).map((r) => ({
            rarity: r,
            weight: slot.odds[r] as number,
          }))

          return (
            <div key={slot.slot} className="flex flex-col gap-2">
              <dt className="font-mono text-xs uppercase tracking-widest text-foreground/70">
                {slot.label}
              </dt>

              <dd className="flex flex-col gap-2">
                {/* Proportional bar so the chase odds read at a glance */}
                <div className="flex h-1 overflow-hidden rounded-full bg-muted">
                  {entries.map(({ rarity, weight }) => (
                    <span
                      key={rarity}
                      aria-hidden="true"
                      className={RARITY_BAR[rarity]}
                      style={{ width: `${weight}%` }}
                    />
                  ))}
                </div>

                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {entries.map(({ rarity, weight }) => (
                    <li key={rarity} className="font-mono text-xs">
                      <span className={RARITY_TEXT[rarity]}>{rarity}</span>
                      <span className="text-muted-foreground"> {weight}%</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )
        })}
      </dl>

      <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Limited Phoenix · 0.1% per pack
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Only five numbered editions can ever be minted. The special third-slot pull ends when the
          collection sells out.
        </p>
      </div>
    </section>
  )
}
