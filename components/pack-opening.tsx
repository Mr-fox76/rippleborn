'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type PackOpeningProps = {
  onComplete?: () => void
  canOpen?: boolean
  packName?: string
  packKicker?: string
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

function playMythicalOpeningSound() {
  const AudioContextClass = window.AudioContext
  const context = new AudioContextClass()
  const now = context.currentTime
  const master = context.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.2, now + 0.08)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)
  master.connect(context.destination)

  const shimmer = context.createOscillator()
  const shimmerGain = context.createGain()
  shimmer.type = 'sine'
  shimmer.frequency.setValueAtTime(174, now)
  shimmer.frequency.exponentialRampToValueAtTime(696, now + 1.35)
  shimmerGain.gain.setValueAtTime(0.0001, now)
  shimmerGain.gain.exponentialRampToValueAtTime(0.28, now + 0.3)
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
  shimmer.connect(shimmerGain).connect(master)
  shimmer.start(now)
  shimmer.stop(now + 1.85)

  ;[261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
    const voice = context.createOscillator()
    const gain = context.createGain()
    voice.type = index % 2 === 0 ? 'sine' : 'triangle'
    voice.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now + index * 0.14)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.18 + index * 0.14)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45 + index * 0.16)
    voice.connect(gain).connect(master)
    voice.start(now + index * 0.14)
    voice.stop(now + 1.6 + index * 0.16)
  })

  window.setTimeout(() => void context.close(), 2600)
}

export function PackOpening({
  onComplete,
  canOpen = true,
  packName = 'Ledgerborn',
  packKicker = 'Mythical Set',
}: PackOpeningProps) {
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
      aria-label={canOpen ? `Open your ${packName} pack` : `${packName} collectible card pack`}
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
          playMythicalOpeningSound()
          setPhase('flipping')
        }}
      >
        <span className="foil-pack-top" aria-hidden="true" />
        <span className="foil-pack-face">
          <span className="foil-pack-kicker">{packKicker}</span>
          <span className="foil-pack-sigil" aria-hidden="true"><span /></span>
          <span className="foil-pack-title">{packName}</span>
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
              <span className="celestial-card-name">{packName}</span>
              <span className="celestial-card-motto">{packKicker}</span>
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
