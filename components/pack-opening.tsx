'use client'

import { useEffect, useState } from 'react'

type PackOpeningProps = {
  onComplete: () => void
}

export function PackOpening({ onComplete }: PackOpeningProps) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!opening) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timer = window.setTimeout(onComplete, media.matches ? 80 : 1900)
    return () => window.clearTimeout(timer)
  }, [onComplete, opening])

  return (
    <section
      className={`pack-opening-stage ${opening ? 'is-opening' : ''}`}
      aria-label="Open your Rippleborn pack"
    >
      <div className="pack-radiance" aria-hidden="true" />
      <button
        type="button"
        className="foil-pack"
        aria-label={opening ? 'Opening pack' : 'Open pack'}
        aria-busy={opening}
        disabled={opening}
        onClick={() => setOpening(true)}
      >
        <span className="foil-pack-top" aria-hidden="true" />
        <span className="foil-pack-face">
          <span className="foil-pack-kicker">XRPL Genesis</span>
          <span className="foil-pack-sigil" aria-hidden="true">
            <span />
          </span>
          <span className="foil-pack-title">Rippleborn</span>
          <span className="foil-pack-count">Three NFT cards</span>
        </span>
        <span className="foil-pack-bottom" aria-hidden="true" />
      </button>
      <div className="pack-deal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="pack-opening-prompt" role="status" aria-live="polite">
        {opening ? 'The pack is opening…' : 'Select the sealed pack to open it'}
      </p>
    </section>
  )
}
