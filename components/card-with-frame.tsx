import type { ReactNode } from 'react'

/** Rarity → pull rate (bottom caption) and the rarity accent color. */
const RARITY_META = {
  Common: { label: 'Common', pct: '65.4%', odds: '1 in 1.5', color: '#b9bfca' },
  Rare: { label: 'Rare', pct: '22%', odds: '1 in 4.5', color: '#3b82f6' },
  Epic: { label: 'Epic', pct: '8%', odds: '1 in 12.5', color: '#a855f7' },
  Legendary: { label: 'Legendary', pct: '3.5%', odds: '1 in 29', color: '#eab308' },
  Mythic: { label: 'Mythic', pct: '1.05%', odds: '1 in 95', color: '#ef4444' },
  Phoenix: { label: 'Phoenix', pct: '0.05%', odds: '1 in 2,000', color: '#fb923c' },
  Ultimate: { label: 'Ultimate', pct: '0.05%', odds: '1 in 2,000', color: '#ffe6a3' },
} as const

type FrameRarity = keyof typeof RARITY_META

/** Unknown/missing rarity falls back to Common per the framing spec. */
function normalizeRarity(rarity?: string): FrameRarity {
  const key = rarity?.trim().toLowerCase()
  if (!key) return 'Common'
  for (const name of Object.keys(RARITY_META) as FrameRarity[]) {
    if (name.toLowerCase() === key) return name
  }
  return 'Common'
}

export function CardWithFrame({
  rarity,
  edition,
  className,
  children,
}: {
  rarity?: string
  /** Nth copy of this card ever pulled; shown as a zero-padded ordinal (e.g. 001). */
  edition?: number
  className?: string
  children: ReactNode
}) {
  const key = normalizeRarity(rarity)
  const meta = RARITY_META[key]

  return (
    <div
      className={`card-frame ${className ?? ''}`}
      style={{ ['--rarity-color' as string]: meta.color }}
    >
      <div className="card-frame__window">{children}</div>
      {typeof edition === 'number' && edition > 0 ? (
        <span className="card-frame__ordinal">V: {String(edition).padStart(3, '0')}</span>
      ) : null}
      <span className="card-frame__badge">{meta.label}</span>
      <span className="card-frame__caption">
        <span className="card-frame__rate">
          <span className="card-frame__rate-pct">{meta.pct}</span>
          <span className="card-frame__rate-odds"> · {meta.odds}</span>
        </span>
      </span>
    </div>
  )
}
