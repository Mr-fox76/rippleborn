'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type PackOpeningProps = {
  onComplete: () => void
}

type OpeningPhase = 'sealed' | 'charging' | 'tearing' | 'releasing' | 'dealing'

const PHASE_TIMINGS: Array<{ phase: OpeningPhase; delay: number }> = [
  { phase: 'charging', delay: 0 },
  { phase: 'tearing', delay: 850 },
  { phase: 'releasing', delay: 1550 },
  { phase: 'dealing', delay: 2250 },
]

const PHASE_COPY: Record<OpeningPhase, string> = {
  sealed: 'Select the sealed pack to begin',
  charging: 'Charging the living ledger…',
  tearing: 'The seal is breaking…',
  releasing: 'Something is emerging…',
  dealing: 'Your cards have arrived',
}

export function PackOpening({ onComplete }: PackOpeningProps) {
  const [phase, setPhase] = useState<OpeningPhase>('sealed')
  const completed = useRef(false)

  const finish = useCallback(() => {
    if (completed.current) return
    completed.current = true
    onComplete()
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
    timers.push(window.setTimeout(finish, 3550))
    return () => timers.forEach(window.clearTimeout)
  }, [finish, opening])

  return (
    <section
      className={`pack-opening-stage phase-${phase}`}
      aria-label="Open your Rippleborn pack"
    >
      <div className="pack-energy-rings" aria-hidden="true"><span /><span /><span /></div>
      <div className="pack-radiance" aria-hidden="true" />
      <div className="pack-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
      </div>

      <button
        type="button"
        className="foil-pack"
        aria-label={opening ? 'Pack opening in progress' : 'Open pack'}
        aria-busy={opening}
        disabled={opening}
        onClick={() => setPhase('charging')}
      >
        <span className="foil-pack-top" aria-hidden="true" />
        <span className="foil-pack-face">
          <span className="foil-pack-kicker">XRPL Genesis</span>
          <span className="foil-pack-sigil" aria-hidden="true"><span /></span>
          <span className="foil-pack-title">Rippleborn</span>
          <span className="foil-pack-count">Three NFT cards</span>
        </span>
        <span className="foil-pack-bottom" aria-hidden="true" />
      </button>

      <div className="pack-tear-piece pack-tear-left" aria-hidden="true" />
      <div className="pack-tear-piece pack-tear-right" aria-hidden="true" />
      <div className="pack-deal" aria-hidden="true"><span /><span /><span /></div>

      <div className="pack-opening-controls">
        <p className="pack-opening-prompt" role="status" aria-live="polite">{PHASE_COPY[phase]}</p>
        {opening ? (
          <Button type="button" variant="ghost" size="sm" onClick={finish} className="pack-skip">
            Skip animation
          </Button>
        ) : null}
      </div>
    </section>
  )
}
