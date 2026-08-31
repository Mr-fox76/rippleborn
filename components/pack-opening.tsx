'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Aperture, CircuitBoard, Sparkles } from 'lucide-react'
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

const PACK_RUNES = {
  Mythic: Sparkles,
  Cyborg: CircuitBoard,
  Chromatic: Aperture,
} as const

function playPackOpeningSound() {
  const AudioContextClass = window.AudioContext
  const context = new AudioContextClass()
  const now = context.currentTime
  const master = context.createGain()
  master.gain.setValueAtTime(0.65, now)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35)
  master.connect(context.destination)

  const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.4), context.sampleRate)
  const noise = noiseBuffer.getChannelData(0)
  for (let index = 0; index < noise.length; index += 1) {
    noise[index] = Math.random() * 2 - 1
  }

  const addTear = (start: number, duration: number, frequency: number, volume: number) => {
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = noiseBuffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency, now + start)
    filter.frequency.exponentialRampToValueAtTime(frequency * 1.8, now + start + duration)
    filter.Q.value = 0.7
    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.linearRampToValueAtTime(volume, now + start + 0.025)
    gain.gain.setValueAtTime(volume * 0.72, now + start + duration * 0.72)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
    source.connect(filter).connect(gain).connect(master)
    source.start(now + start, Math.random() * 0.2, duration)
  }

  // Short foil crinkles lead into one continuous seam tear and a final opening snap.
  addTear(0, 0.09, 2800, 0.28)
  addTear(0.1, 0.1, 3400, 0.24)
  addTear(0.22, 0.72, 1250, 0.5)
  addTear(0.31, 0.58, 3800, 0.2)
  addTear(0.91, 0.16, 700, 0.58)
  addTear(1.05, 0.22, 2400, 0.2)

  window.setTimeout(() => void context.close(), 1500)
}

export function PackOpening({
  onComplete,
  canOpen = true,
  packName = 'Ledgerborn',
  packKicker = 'Mythical Set',
}: PackOpeningProps) {
  const [phase, setPhase] = useState<OpeningPhase>('sealed')
  const completed = useRef(false)
  const packLabel = packKicker in PACK_RUNES ? packKicker as keyof typeof PACK_RUNES : 'Mythic'
  const PackRune = PACK_RUNES[packLabel]

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
          playPackOpeningSound()
          setPhase('flipping')
        }}
      >
        <span className="foil-pack-top" aria-hidden="true" />
        <span className="foil-pack-face">
          <span className="foil-pack-rune" aria-hidden="true">
            <PackRune className="foil-pack-rune-icon" strokeWidth={1.5} />
          </span>
          <span className="foil-pack-title">{packLabel}</span>
          <span className="foil-pack-caption">Three card pack</span>
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
              <span className="celestial-card-name">{packLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pack-opening-controls">
        <p className="pack-opening-prompt" role="status" aria-live="polite">
          {!canOpen && phase === 'sealed' ? 'Purchase a pack to break the seal' : PHASE_COPY[phase]}
        </p>
        <div className="pack-opening-button-row">
          {opening ? (
            <Button type="button" variant="ghost" size="sm" onClick={finish} className="pack-skip">
              Skip animation
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
