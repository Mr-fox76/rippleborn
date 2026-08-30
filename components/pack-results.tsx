'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimNftButton } from '@/components/claim-nft-button'
import { getCardWisdom, type Card } from '@/lib/rippleborn'

export type FulfilledCard = Card & {
  mintStatus?: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  mintedAt?: string
  claimExpiresAt?: string
  reason?: string
}

const RARITY_CLASSES: Record<Card['rarity'], string> = {
  Common: 'rarity-common',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
  Mythic: 'rarity-mythic',
}

const ARTWORK_PRESENTATION: Partial<Record<Card['name'], string>> = {
  'Thought Diver': 'scale-125',
  'The Phoenix': 'scale-125',
}

function getArtworkClass(card: Card) {
  return ARTWORK_PRESENTATION[card.name] ?? ''
}

function playCardFlipSound() {
  try {
    const context = new AudioContext()
    const now = context.currentTime
    const master = context.createGain()
    master.gain.setValueAtTime(0.32, now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.34)
    master.connect(context.destination)

    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.3), context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1
    }

    const paper = context.createBufferSource()
    const paperFilter = context.createBiquadFilter()
    const paperGain = context.createGain()
    paper.buffer = buffer
    paperFilter.type = 'bandpass'
    paperFilter.frequency.setValueAtTime(1800, now)
    paperFilter.frequency.exponentialRampToValueAtTime(5200, now + 0.13)
    paperFilter.Q.value = 0.8
    paperGain.gain.setValueAtTime(0.0001, now)
    paperGain.gain.linearRampToValueAtTime(0.65, now + 0.018)
    paperGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    paper.connect(paperFilter).connect(paperGain).connect(master)
    paper.start(now, Math.random() * 0.08, 0.2)

    const landing = context.createOscillator()
    const landingGain = context.createGain()
    landing.type = 'triangle'
    landing.frequency.setValueAtTime(170, now + 0.13)
    landing.frequency.exponentialRampToValueAtTime(85, now + 0.2)
    landingGain.gain.setValueAtTime(0.0001, now)
    landingGain.gain.setValueAtTime(0.48, now + 0.13)
    landingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    landing.connect(landingGain).connect(master)
    landing.start(now + 0.13)
    landing.stop(now + 0.23)

    window.setTimeout(() => void context.close(), 450)
  } catch {
    // Audio is an enhancement; revealing must still work if playback is unavailable.
  }
}

function FaceDownCard({
  index,
  isChaseSlot = false,
  onReveal,
}: {
  index: number
  isChaseSlot?: boolean
  onReveal?: () => void
}) {
  const content = (
    <div className="tarot-back-inner">
      <span className="celestial-orbit" aria-hidden="true">
        <span className="celestial-core" />
      </span>
      <span className="celestial-card-name" aria-hidden="true">Ledgerborn</span>
      <span className="celestial-card-motto" aria-hidden="true">Genesis Collection</span>
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
      className={`tarot-card tarot-back tarot-reveal-button ${isChaseSlot ? 'is-chase-slot' : ''}`}
      aria-label={`Reveal card ${index + 1}${isChaseSlot ? ', enhanced Mythic chance' : ''}`}
      onClick={onReveal}
    >
      {content}
    </button>
  )
}

function RevealedSpread({
  cards,
  buyer,
  onReset,
}: {
  cards: FulfilledCard[]
  buyer: string | null
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
    const timer = window.setTimeout(() => {
      setRevealed((current) => new Set(current).add(revealing))
      setRevealing(null)
    }, reducedMotion ? 40 : 650)
    return () => window.clearTimeout(timer)
  }, [revealing])

  const markClaimed = useCallback((nftId: string) => {
    setClaimed((current) => new Set(current).add(nftId))
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <ol className="tarot-spread mx-auto flex w-full max-w-7xl items-start justify-center gap-3 sm:gap-7">
        {[1, 0, 2].map((index) => {
        const card = cards[index]
        const isRevealed = revealed.has(index)

        return (
          <li
            key={card?.id ?? index}
            className={`tarot-slot min-w-0 flex-1 ${revealing === index ? 'is-revealing' : ''} ${revealed.size === cards.length ? 'is-collected' : ''}`}
          >
            {card && isRevealed ? (
              <article
                className={`tarot-card tarot-reveal relative ${RARITY_CLASSES[card.rarity]} ${card.limited ? 'phoenix-reveal' : ''} overflow-hidden bg-card shadow-2xl`}
              >
                <div
                  className="rarity-art-frame group/wisdom relative aspect-[2/3] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  tabIndex={0}
                  aria-label={`${card.name} wisdom: ${getCardWisdom(card.name)}`}
                >
                  <div className="absolute inset-2 overflow-hidden rounded-sm bg-card">
                    <Image
                      src={card.image}
                      alt=""
                      aria-hidden="true"
                      fill
                      priority
                      sizes="(max-width: 640px) 30vw, 320px"
                      className="scale-110 object-cover opacity-45 blur-xl"
                    />
                    <div className="absolute inset-0 bg-card/20" aria-hidden="true" />
                    <Image
                      src={card.image}
                      alt={`${card.name}, ${card.rarity} card`}
                      fill
                      priority
                      sizes="(max-width: 640px) 30vw, 320px"
                      className={`relative z-[1] object-cover object-center ${getArtworkClass(card)}`}
                    />
                  </div>
                  <div className="absolute right-2 top-2 z-30 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
                    <p className="rarity-badge inline-flex rounded-full border px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] sm:text-xs">
                      {card.rarity}
                    </p>
                    {card.limited && card.edition && card.maxSupply ? (
                      <span className="phoenix-edition rounded-full border px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] sm:text-xs">
                        Edition {card.edition}/{card.maxSupply}
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-card via-card/85 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 group-hover/wisdom:opacity-0 group-focus/wisdom:opacity-0 sm:px-4 sm:pb-4">
                    <p className="text-center font-sans text-sm font-semibold leading-tight text-card-foreground text-pretty sm:text-base">
                      “{card.name}”
                    </p>
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-card/95 p-4 opacity-0 transition-opacity duration-300 group-hover/wisdom:opacity-100 group-focus/wisdom:opacity-100">
                    <blockquote className="text-center font-sans text-sm italic leading-relaxed text-card-foreground text-pretty sm:text-base">
                      “{getCardWisdom(card.name)}”
                    </blockquote>
                  </div>
                </div>
                {card.mintStatus === 'minted' && card.nftId && card.offerId && buyer ? (
                  <div className="rarity-action-footer p-3">
                    <ClaimNftButton
                      buyer={buyer}
                      nftId={card.nftId}
                      offerId={card.offerId}
                      claimExpiresAt={card.claimExpiresAt}
                      onClaimed={markClaimed}
                    />
                  </div>
                ) : null}
              </article>
            ) : (
              <FaceDownCard
                index={index}
                isChaseSlot={card?.slot === 3}
                onReveal={card && revealing === null ? () => revealCard(index) : undefined}
              />
            )}
          </li>
        )
        })}
      </ol>
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
  )
}

export function TarotCards({
  cards,
  buyer,
  onReset,
}: {
  cards: FulfilledCard[] | null
  buyer: string | null
  onReset?: () => void
}) {
  return (
    <section aria-label={cards ? 'Reveal your cards' : 'Three face-down cards'}>
      {cards ? (
        <RevealedSpread
          key={cards.map((card) => card.id).join(':')}
          cards={cards}
          buyer={buyer}
          onReset={onReset}
        />
      ) : (
        <ol className="tarot-spread mx-auto flex w-full max-w-7xl items-start justify-center gap-3 sm:gap-7">
          {[0, 1, 2].map((index) => (
            <li key={index} className="tarot-slot min-w-0 flex-1">
              <FaceDownCard index={index} />
            </li>
          ))}
        </ol>
      )}
      {cards ? (
        <p className="mt-5 text-center font-mono text-xs uppercase tracking-[0.2em] text-gold" aria-live="polite">
          Reveal the cards in any order. The distinct glow marks the slot with a Mythic chance.
        </p>
      ) : null}
    </section>
  )
}
