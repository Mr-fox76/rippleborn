import type { CSSProperties } from 'react'
import type { PackCatalogEntry } from '@/lib/pack-catalog'

const styleArtwork = {
  mythic: '/images/mythic-card-style-sample.png',
  cyborg: '/sets/cyborg-cowboy/images/gunslinger-zero.png',
  chromatic: '/sets/chromatic-abyss/images/thousand-petaled-mind.png',
} as const

export function CardStylePreview({ theme }: { theme: PackCatalogEntry['theme']['id'] }) {
  return (
    <section
      className={`card-style-preview card-style-preview-${theme}`}
      style={{ '--style-guide-art': `url(${styleArtwork[theme]})` } as CSSProperties}
      aria-labelledby="card-style-preview-title"
    >
      <div className="card-style-preview-copy">
        <p className="pack-theme-accent font-mono text-[0.65rem] uppercase tracking-[0.3em]">Visual field guide</p>
        <h2 id="card-style-preview-title" className="font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          A glimpse of the new art style
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          A preview of this collection&apos;s refreshed visual world. Pack contents—and its rarest discoveries—remain hidden until opening.
        </p>
      </div>
    </section>
  )
}
