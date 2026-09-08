import type { ReactNode } from 'react'

/** Shared black metal sleeve; rarity is signalled by the top plate color. */
const FRAME = '/frames/frame.svg'

/** Rarity → pull rate (bottom plate) and the color of the top rarity plate. */
const RARITY_META = {
  Common: { label: 'Common', rate: '65.4% · 1 in 1.5', color: '#b9bfca' },
  Rare: { label: 'Rare', rate: '22% · 1 in 4.5', color: '#3b82f6' },
  Epic: { label: 'Epic', rate: '8% · 1 in 12.5', color: '#a855f7' },
  Legendary: { label: 'Legendary', rate: '3.5% · 1 in 29', color: '#eab308' },
  Mythic: { label: 'Mythic', rate: '1.05% · 1 in 95', color: '#ef4444' },
  Phoenix: { label: 'Phoenix', rate: '0.05% · 1 in 2,000', color: '#fb923c' },
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
  className,
  children,
}: {
  rarity?: string
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
      <img className="card-frame__sleeve" src={FRAME} alt="" aria-hidden="true" />
      <span className="card-frame__rarity">{meta.label}</span>
      <span className="card-frame__caption">
        <span className="card-frame__rate">{meta.rate}</span>
      </span>
    </div>
  )
}
