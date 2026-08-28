'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type PackOpeningProps = {
  onComplete?: () => void
  canOpen?: boolean
}

type OpeningPhase = 'sealed' | 'flipping' | 'spreading'

const PHASE_TIMINGS: Array<{ phase: OpeningPhase; delay: number }> = [
  { phase: 'flipping', delay: 0 },
  { phase: 'spreading', delay: 1050 },
]

const PHASE_COPY: Record<OpeningPhase, string> = {
  sealed: 'Select the sealed pack to begin',
  flipping: 'The first card emerges…',
  spreading: 'Three fates await your reveal',
}

export function PackOpening({ onComplete, canOpen = true }: PackOpeningProps) {
  const [phase, setPhase] = useState<OpeningPhase>('sealed')
  const completed = useRef(false)

  const finish = useCallback(() => {
    if (completed.current) return
    completed.current = true
    onComplete?.()
  }, [onComplete])

  const opening = phase !== 'sealed'

  useEffect(() => {
    if (!opening) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      const timer = window.setTimeout(finish, 100)
      return () => window.clearTimeout(timer)
    }

    const timers = PHASE_TIMINGS.filter(({ delay }) => delay > 0).map(({ phase: next, delay }) =>
      window.setTimeout(() => setPhase(next), delay),
    )
    timers.push(window.setTimeout(finish, 2200))
    return () => timers.forEach(window.clearTimeout)
  }, [finish, opening])

  return (
    <section
      className={`pack-opening-stage phase-${phase} ${canOpen ? 'can-open' : 'pack-preview'}`}
      aria-label={canOpen ? 'Open your Ledgerborn pack' : 'Ledgerborn collectible card pack'}
    >
      <div className="pack-radiance" aria-hidden="true" />

      <button
        type="button"
        className="foil-pack"
        aria-label={opening ? 'Pack opening in progress' : canOpen ? 'Open pack' : 'Purchase pack to open'}
        aria-busy={opening}
        aria-disabled={!canOpen || opening}
        disabled={opening}
        onClick={() => {
          if (!canOpen) return
          const sound = new Audio('/audio/ledger-awakening.wav')
          sound.volume = 0.34
          void sound.play().catch(() => undefined)
          setPhase('flipping')
        }}
      >
        <span className="foil-pack-top" aria-hidden="true" />
        <span className="foil-pack-face">
          <span className="foil-pack-kicker">Mythical Set</span>
          <span className="foil-pack-sigil" aria-hidden="true"><span /></span>
          <span className="foil-pack-title">Ledgerborn</span>
          <span className="foil-pack-count" aria-label="Three card pack">
            <span className="foil-pack-count-number" aria-hidden="true">3</span>
            <span aria-hidden="true">Pack</span>
          </span>
        </span>
        <span className="foil-pack-bottom" aria-hidden="true" />
      </button>

      <div className="opening-card-stack" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="opening-card tarot-card tarot-back" key={index}>
            <div className="tarot-back-inner">
              <span className="celestial-orbit">
                <span className="celestial-core" />
              </span>
              <span className="celestial-card-name">Ledgerborn</span>
              <span className="celestial-card-motto">Mythical Set</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pack-opening-controls">
        <p className="pack-opening-prompt" role="status" aria-live="polite">
          {!canOpen && phase === 'sealed' ? 'Purchase a pack to break the seal' : PHASE_COPY[phase]}
        </p>
        {opening ? (
          <Button type="button" variant="ghost" size="sm" onClick={finish} className="pack-skip">
            Skip animation
          </Button>
        ) : null}
      </div>
    </section>
  )
}
