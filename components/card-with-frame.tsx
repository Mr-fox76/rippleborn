import type { ReactNode } from 'react'

/** Rarity → premium sleeve frame plus the pull rate shown on the bottom plate. */
const RARITY_META = {
  Common: { label: 'Common', rate: '65.4% · 1 in 1.5', frame: '/frames/common.svg' },
  Rare: { label: 'Rare', rate: '22% · 1 in 4.5', frame: '/frames/rare.svg' },
  Epic: { label: 'Epic', rate: '8% · 1 in 12.5', frame: '/frames/epic.svg' },
  Legendary: { label: 'Legendary', rate: '3.5% · 1 in 29', frame: '/frames/legendary.svg' },
  Mythic: { label: 'Mythic', rate: '1.05% · 1 in 95', frame: '/frames/mythic.svg' },
  Phoenix: { label: 'Phoenix', rate: '0.05% · 1 in 2,000', frame: '/frames/phoenix.svg' },
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
    <div className={`card-frame ${className ?? ''}`}>
      <div className="card-frame__window">{children}</div>
      <img className="card-frame__sleeve" src={meta.frame} alt="" aria-hidden="true" />
      <span className="card-frame__rarity">{meta.label}</span>
      <span className="card-frame__caption">
        <span className="card-frame__rate">{meta.rate}</span>
      </span>
    </div>
  )
}
