'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimNftButton } from '@/components/claim-nft-button'
import { CardWithFrame } from '@/components/card-with-frame'
import type { SampleCard } from '@/lib/pack-catalog'
import { getDisplayCardName, type Card } from '@/lib/rippleborn'

export type FulfilledCard = Card & {
  mintStatus?: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  mintedAt?: string
  claimExpiresAt?: string
  discoveryNumber?: number
  discoveredTotal?: number
  cardIdentifier?: string
  discovery?: number
  discoveredAtPull?: number
  setCode?: string
  cardNumber?: number
  setSize?: number
  reason?: string
}

const RARITY_CLASSES: Record<Card['rarity'], string> = {
  Common: 'rarity-common',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
  Mythic: 'rarity-mythic',
  Phoenix: 'rarity-phoenix',
}

function playCardFlipSound() {
  try {
    // Short card-turn whoosh (<1s). Started from the user's click, never autoplayed.
    const audio = new Audio('/audio/card-flip.mp3')
    audio.volume = 0.5
    // Play returns a promise that rejects if the browser blocks audio; swallow it.
    void audio.play().catch(() => {})
  } catch {
    // Audio is an enhancement; revealing must still work if playback is unavailable.
  }
}

function playPhoenixFanfare() {
  try {
    const context = new AudioContext()
    const now = context.currentTime
    const master = context.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.24, now + 0.04)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
    master.connect(context.destination)

    ;[261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
      const tone = context.createOscillator()
      const gain = context.createGain()
      const start = now + index * 0.11
      tone.type = index === 3 ? 'sine' : 'triangle'
      tone.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.6, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
      tone.connect(gain).connect(master)
      tone.start(start)
      tone.stop(start + 0.75)
    })

    window.setTimeout(() => void context.close(), 1800)
  } catch {
    // Audio is an enhancement; the Phoenix reveal must still work without it.
  }
}

type RevealVoice = { freq: number; type: OscillatorType; delay: number; peak: number; dur: number }

// One-shot reveal sting keyed to rarity, played the moment the card face lands.
// Common stays silent (flip whoosh only); Phoenix uses its own unique fanfare.
function playRevealSound(rarity: Card['rarity']) {
  if (rarity === 'Common') return
  if (rarity === 'Phoenix') {
    playPhoenixFanfare()
    return
  }
  try {
    const context = new AudioContext()
    const now = context.currentTime
    const master = context.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.03)
    master.connect(context.destination)

    let voices: RevealVoice[]
    let tail: number

    if (rarity === 'Rare') {
      // short soft chime — two gentle notes
      voices = [
        { freq: 659.25, type: 'sine', delay: 0, peak: 0.5, dur: 0.42 },
        { freq: 987.77, type: 'sine', delay: 0.08, peak: 0.4, dur: 0.5 },
      ]
      tail = 0.6
    } else if (rarity === 'Epic') {
      // richer chime — major triad with a warmer voicing
      voices = [
        { freq: 523.25, type: 'triangle', delay: 0, peak: 0.45, dur: 0.55 },
        { freq: 659.25, type: 'triangle', delay: 0.05, peak: 0.42, dur: 0.55 },
        { freq: 783.99, type: 'sine', delay: 0.1, peak: 0.4, dur: 0.62 },
      ]
      tail = 0.72
    } else if (rarity === 'Legendary') {
      // brighter fanfare — quick ascending arpeggio, still short
      voices = [
        { freq: 659.25, type: 'triangle', delay: 0, peak: 0.5, dur: 0.38 },
        { freq: 830.61, type: 'triangle', delay: 0.07, peak: 0.5, dur: 0.38 },
        { freq: 987.77, type: 'triangle', delay: 0.14, peak: 0.5, dur: 0.42 },
        { freq: 1318.51, type: 'sine', delay: 0.21, peak: 0.55, dur: 0.55 },
      ]
      tail = 0.85
    } else {
      // Mythic — bigger hit: low impact plus a bright shimmer on top
      voices = [
        { freq: 98, type: 'sawtooth', delay: 0, peak: 0.6, dur: 0.7 },
        { freq: 196, type: 'triangle', delay: 0, peak: 0.4, dur: 0.7 },
        { freq: 392, type: 'triangle', delay: 0.05, peak: 0.4, dur: 0.72 },
        { freq: 587.33, type: 'sine', delay: 0.13, peak: 0.4, dur: 0.78 },
      ]
      tail = 1
    }

    voices.forEach((voice) => {
      const start = now + voice.delay
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = voice.type
      osc.frequency.setValueAtTime(voice.freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(voice.peak, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.dur)
      osc.connect(gain).connect(master)
      osc.start(start)
      osc.stop(start + voice.dur + 0.05)
    })

    master.gain.exponentialRampToValueAtTime(0.0001, now + tail + 0.3)
    window.setTimeout(() => void context.close(), (tail + 0.6) * 1000)
  } catch {
    // Audio is an enhancement; the reveal must still work without it.
  }
}

function FaceDownCard({
  index,
  setName,
  rarity,
  limited = false,
  onReveal,
}: {
  index: number
  setName: string
  rarity?: Card['rarity']
  limited?: boolean
  onReveal?: () => void
}) {
  const rarityClass = rarity ? RARITY_CLASSES[rarity] : ''
  const glowClass = limited ? 'rarity-limited' : rarityClass
  const content = (
    <div className="tarot-back-inner">
      <span className="celestial-orbit" aria-hidden="true">
        <span className="celestial-core" />
      </span>
      <span className="celestial-card-name" aria-hidden="true">{setName}</span>
      <span className="celestial-card-motto" aria-hidden="true">Card collection</span>
      <span className="sr-only">Face-down card {index + 1}</span>
    </div>
  )

  if (!onReveal) {
    return (
      <div className="tarot-card tarot-back" aria-label={`Face-down card ${index + 1}`}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`tarot-card tarot-back tarot-reveal-button ${glowClass}`}
      aria-label={`Reveal card ${index + 1}`}
      onClick={onReveal}
    >
      {content}
    </button>
  )
}

/** Static, display-only card that previews real set art in the sealed-pack slots (no reveal/claim). */
function SamplePreviewCard({ card }: { card: SampleCard }) {
  return (
    <CardWithFrame rarity={card.rarity} className="tarot-sample-card">
      <div className="collection-display-art relative bg-background" data-card-name={card.name}>
        <Image
          src={card.image}
          alt={`${getDisplayCardName(card.name)}, ${card.rarity} sample card`}
          fill
          priority
          quality={70}
          sizes="(max-width: 639px) calc(100vw - 2rem), 320px"
          className="object-cover object-center"
        />
        <div className="collection-display-sheen" aria-hidden="true" />
      </div>
    </CardWithFrame>
  )
}

function RevealedSpread({
  cards,
  buyer,
  setName,
  onReset,
}: {
  cards: FulfilledCard[]
  buyer: string | null
  setName: string
  onReset?: () => void
}) {
  const [revealed, setRevealed] = useState(() => new Set<number>())
  const [revealing, setRevealing] = useState<number | null>(null)
  const [claimed, setClaimed] = useState(() => new Set<string>())
  const claimableCards = cards.filter((card) => card.mintStatus === 'minted' && card.nftId)
  const canReset =
    revealed.size === cards.length &&
    claimableCards.length > 0 &&
    claimableCards.every((card) => card.nftId && claimed.has(card.nftId))

  function revealCard(index: number) {
    if (revealing !== null || revealed.has(index)) return
    playCardFlipSound()
    setRevealing(index)
  }

  useEffect(() => {
    if (revealing === null) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const landingRarity = cards[revealing]?.rarity
    const timer = window.setTimeout(() => {
      if (landingRarity) playRevealSound(landingRarity)
      setRevealed((current) => new Set(current).add(revealing))
      setRevealing(null)
    }, reducedMotion ? 40 : 650)
    return () => window.clearTimeout(timer)
  }, [revealing, cards])

  const markClaimed = useCallback((nftId: string) => {
    setClaimed((current) => new Set(current).add(nftId))
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <ol className="tarot-spread mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:gap-7">
        {[1, 0, 2].map((index) => {
        const card = cards[index]
        const displayName = card ? getDisplayCardName(card.name) : ''
        const isRevealed = revealed.has(index)

        return (
          <li
            key={card?.id ?? index}
            className={`tarot-slot w-full max-w-sm min-w-0 flex-none sm:max-w-none sm:flex-1 ${revealing === index ? 'is-revealing' : ''} ${revealed.size === cards.length ? 'is-collected' : ''}`}
          >
            <div className={`tarot-slot-frame ${card ? RARITY_CLASSES[card.rarity] : ''} ${card && isRevealed ? 'show-face' : 'show-back'}`}>
              <div className="tarot-slot-face tarot-slot-back">
                <FaceDownCard
                  index={index}
                  setName={setName}
                  rarity={card?.rarity}
                  limited={card?.limited}
                  onReveal={card && revealing === null && !isRevealed ? () => revealCard(index) : undefined}
                />
              </div>
              <div className="tarot-slot-face tarot-slot-front" aria-hidden={!card || !isRevealed}>
              {card ? (
              <>
              <article
                className={`tarot-card tarot-reveal relative ${RARITY_CLASSES[card.rarity]} ${card.rarity === 'Phoenix' || card.name === 'The Phoenix' ? 'phoenix-reveal' : ''}`}
              >
                {card.rarity === 'Phoenix' ? (
                  <div className="phoenix-victory-banner" role="status" aria-live="assertive">
                    <span>Godlike pull</span>
                    <strong>The Phoenix awakens</strong>
                  </div>
                ) : null}
                <CardWithFrame rarity={card.rarity} edition={card.discovery ?? card.discoveryNumber}>
                  <div
                    className="collection-display-art relative bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rarity-color)]"
                    data-card-name={card.name}
                    tabIndex={0}
                    aria-label={`${displayName}, ${card.rarity} card`}
                  >
                    <Image
                      src={card.image}
                      alt={`${displayName}, ${card.rarity} card`}
                      fill
                      unoptimized
                      sizes="(max-width: 639px) calc(100vw - 2rem), 320px"
                      className="object-cover object-center"
                    />
                    <div className="collection-display-sheen" aria-hidden="true" />
                  </div>
                </CardWithFrame>
                <div className="reveal-caption">
                  {(() => {
                    const discovery = card.discovery ?? card.discoveryNumber
                    const discoveredAtPull = card.discoveredAtPull ?? card.discoveryNumber
                    if (typeof discovery !== 'number' || typeof discoveredAtPull !== 'number') return null
                    return (
                      <span className="font-mono text-xs font-semibold tracking-wide text-foreground">
                        {discovery} / {discoveredAtPull}
                      </span>
                    )
                  })()}
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    {card.setCode && typeof card.cardNumber === 'number' && typeof card.setSize === 'number' ? (
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {card.setCode} {String(card.cardNumber).padStart(2, '0')}/{String(card.setSize).padStart(2, '0')}
                      </span>
                    ) : null}
                    {card.limited && card.edition && card.maxSupply ? (
                      <span className="phoenix-edition rounded-full border px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] sm:text-xs">
                        {card.edition}/{card.maxSupply}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
              <div className="rarity-action-footer shrink-0 p-3">
                {card.nftId && card.offerId && buyer ? (
                  <ClaimNftButton
                    buyer={buyer}
                    nftId={card.nftId}
                    offerId={card.offerId}
                    claimExpiresAt={card.claimExpiresAt}
                    onClaimed={markClaimed}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button type="button" size="sm" disabled className="w-full font-mono text-xs font-semibold uppercase tracking-wider">
                      {card.nftId && card.offerId
                        ? 'Reconnect Xaman to claim'
                        : card.mintStatus === 'failed'
                          ? 'NFT mint failed'
                          : card.mintStatus === 'skipped'
                            ? 'NFT mint skipped'
                            : 'NFT claim unavailable'}
                    </Button>
                    {card.reason ? (
                      <p className="text-pretty text-center font-mono text-xs leading-relaxed text-destructive" role="status">
                        {card.reason}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              </>
              ) : null}
              </div>
            </div>
          </li>
        )
        })}
      </ol>
      <div className="tarot-control-row">
        {canReset && onReset ? (
          <Button
            type="button"
            size="lg"
            onClick={onReset}
            className="primary-action px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em]"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Reset the deck
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function TarotCards({
  cards,
  buyer,
  setName,
  sampleCards,
  onReset,
}: {
  cards: FulfilledCard[] | null
  buyer: string | null
  setName: string
  sampleCards?: readonly SampleCard[]
  onReset?: () => void
}) {
  const hasSamples = Boolean(sampleCards?.length)
  return (
    <section className={!cards && hasSamples ? 'tarot-sample-shell' : undefined} aria-label={cards ? 'Reveal your cards' : 'Sample cards from this set'}>
      {cards ? (
        <RevealedSpread
          key={cards.map((card) => card.id).join(':')}
          cards={cards}
          buyer={buyer}
          setName={setName}
          onReset={onReset}
        />
      ) : (
        <div className="flex flex-col items-center gap-6">
      <ol className="tarot-spread mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:gap-7">
            {[1, 0, 2].map((index) => {
              const sample = index === 1 ? sampleCards?.[0] : index === 2 ? sampleCards?.[1] : undefined
              return (
                <li key={index} className="tarot-slot w-full max-w-sm min-w-0 flex-none sm:max-w-none sm:flex-1">
                  {sample ? (
                    <SamplePreviewCard card={sample} />
                  ) : hasSamples ? (
                    <div className="tarot-sample-spacer" aria-hidden="true" />
                  ) : (
                    <div className="tarot-slot-frame show-back">
                      <div className="tarot-slot-face tarot-slot-back">
                        <FaceDownCard index={index} setName={setName} />
                      </div>
                      <div className="tarot-slot-face tarot-slot-front" aria-hidden="true" />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <div className="tarot-control-row" />
        </div>
      )}
      <p className="tarot-instruction text-center font-mono text-xs uppercase tracking-[0.2em] text-gold" aria-live="polite">
        {cards ? 'Reveal the cards in any order. Each glow reflects the rarity already locked inside.' : ''}
      </p>
      {!cards && hasSamples ? (
        <p className="tarot-sample-note text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          Sample cards from this set
        </p>
      ) : null}
    </section>
  )
}
