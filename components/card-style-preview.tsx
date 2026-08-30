import type { PackCatalogEntry } from '@/lib/pack-catalog'

const sampleDetails = {
  mythic: [
    { mark: 'I', caption: 'Emberbound' },
    { mark: 'II', caption: 'Elder Sigil' },
    { mark: 'III', caption: 'Astral Forge' },
  ],
  cyborg: [
    { mark: 'A7', caption: 'Dust Circuit' },
    { mark: 'K2', caption: 'Neon Range' },
    { mark: 'X9', caption: 'Steel Horizon' },
  ],
  chromatic: [
    { mark: 'α', caption: 'Lucid Bloom' },
    { mark: 'β', caption: 'Prism Echo' },
    { mark: 'γ', caption: 'Abyssal Form' },
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
              <div className="concept-card-art">
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
