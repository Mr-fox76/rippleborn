import type { CSSProperties } from 'react'
import type { PackCatalogEntry } from '@/lib/pack-catalog'

const sampleDetails = {
  mythic: [
    { mark: 'I', caption: 'Emberbound', art: '/images/sample-mythic-emberbound.png' },
    { mark: 'II', caption: 'Elder Sigil', art: '/images/sample-mythic-elder-sigil.png' },
    { mark: 'III', caption: 'Astral Forge', art: '/images/sample-mythic-astral-forge.png' },
  ],
  cyborg: [
    { mark: 'A7', caption: 'Dust Circuit', art: '/images/sample-cyborg-dust-circuit.png' },
    { mark: 'K2', caption: 'Neon Range', art: '/images/sample-cyborg-neon-range.png' },
    { mark: 'X9', caption: 'Steel Horizon', art: '/images/sample-cyborg-steel-horizon.png' },
  ],
  chromatic: [
    { mark: 'α', caption: 'Lucid Bloom', art: '/images/sample-chromatic-lucid-bloom.png' },
    { mark: 'β', caption: 'Prism Echo', art: '/images/sample-chromatic-prism-echo.png' },
    { mark: 'γ', caption: 'Abyssal Form', art: '/images/sample-chromatic-abyssal-form.png' },
  ],
} as const

export function CardStylePreview({ theme }: { theme: PackCatalogEntry['theme']['id'] }) {
  return (
    <section className={`card-style-preview card-style-preview-${theme}`} aria-labelledby="card-style-preview-title">
      <div className="card-style-preview-copy">
        <p className="pack-theme-accent font-mono text-[0.65rem] uppercase tracking-[0.3em]">Visual field guide</p>
        <h2 id="card-style-preview-title" className="font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          A glimpse of the card style
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Illustrative design studies inspired by this collection. These are not actual cards or guaranteed pack contents.
        </p>
      </div>

      <div className="card-style-preview-deck" aria-label="Three illustrative card-style concepts">
        {sampleDetails[theme].map((sample, index) => (
          <div className="concept-card" key={sample.caption}>
            <div className="concept-card-frame" aria-hidden="true">
              <span className="concept-card-index">{sample.mark}</span>
              <div
                className="concept-card-art"
                style={{ '--concept-card-art': `url(${sample.art})` } as CSSProperties}
              >
                <i className="concept-art-core" />
                <i className="concept-art-detail" />
              </div>
              <div className="concept-card-rule" />
              <span className="concept-card-caption">{sample.caption}</span>
              <span className="concept-card-code">STYLE {String(index + 1).padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
