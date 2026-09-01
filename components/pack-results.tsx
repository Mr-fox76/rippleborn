'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimNftButton } from '@/components/claim-nft-button'
import { getCardWisdom, getDisplayCardName, type Card } from '@/lib/rippleborn'

export type FulfilledCard = Card & {
  mintStatus?: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  mintedAt?: string
  claimExpiresAt?: string
  discoveryNumber?: number
  discoveredTotal?: number
  cardIdentifier?: string
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
    if (cards[index]?.rarity === 'Phoenix') {
      window.setTimeout(playPhoenixFanfare, 430)
    }
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
            <div className={`tarot-slot-frame ${card && isRevealed ? 'show-face' : 'show-back'}`}>
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
                className={`tarot-card tarot-reveal collection-display-card relative ${RARITY_CLASSES[card.rarity]} ${card.rarity === 'Phoenix' || card.name === 'The Phoenix' ? 'phoenix-reveal' : ''} overflow-hidden`}
              >
                {card.rarity === 'Phoenix' ? (
                  <div className="phoenix-victory-banner" role="status" aria-live="assertive">
                    <span>Godlike pull</span>
                    <strong>The Phoenix awakens</strong>
                  </div>
                ) : null}
                <div
                  className="collection-display-art group/wisdom relative aspect-[2/3] overflow-hidden bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  data-card-name={card.name}
                  tabIndex={0}
                  aria-label={`${displayName} wisdom: ${getCardWisdom(card.name)}`}
                >
                  <Image
                    src={card.image}
                    alt={`${displayName}, ${card.rarity} card`}
                    fill
                    quality={75}
                    sizes="(max-width: 639px) calc(100vw - 2rem), 320px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <div className="collection-display-sheen" aria-hidden="true" />
                  {card.cardIdentifier ? (
                    <span className="collection-discovery-mark" aria-label={`Card identifier ${card.cardIdentifier}`}>
                      {card.cardIdentifier}
                    </span>
                  ) : null}
                  <span className="collection-edition-mark" aria-hidden="true">LB</span>
                  <div className="collection-card-caption z-10 flex items-end justify-between gap-2 transition-opacity duration-300 group-hover/wisdom:opacity-0 group-focus/wisdom:opacity-0">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-pretty text-sm font-semibold leading-snug text-foreground sm:text-base">{displayName}</h3>
                      <span className="collection-rarity-seal">{card.rarity}</span>
                    </div>
                    {card.limited && card.edition && card.maxSupply ? (
                      <span className="phoenix-edition rounded-full border px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] sm:text-xs">
                        {card.edition}/{card.maxSupply}
                      </span>
                    ) : null}
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-card/95 p-4 opacity-0 transition-opacity duration-300 group-hover/wisdom:opacity-100 group-focus/wisdom:opacity-100">
                    <blockquote className="text-center font-sans text-sm italic leading-relaxed text-card-foreground text-pretty sm:text-base">
                      ���{getCardWisdom(card.name)}”
                    </blockquote>
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
                  <Button type="button" size="sm" disabled className="w-full font-mono text-xs font-semibold uppercase tracking-wider">
                    {card.nftId && card.offerId ? 'Reconnect Xaman to claim' : 'NFT claim unavailable'}
                  </Button>
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
  onReset,
}: {
  cards: FulfilledCard[] | null
  buyer: string | null
  setName: string
  onReset?: () => void
}) {
  return (
    <section aria-label={cards ? 'Reveal your cards' : 'Three face-down cards'}>
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
            {[1, 0, 2].map((index) => (
              <li key={index} className="tarot-slot w-full max-w-sm min-w-0 flex-none sm:max-w-none sm:flex-1">
                <div className="tarot-slot-frame show-back">
                  <div className="tarot-slot-face tarot-slot-back">
                    <FaceDownCard index={index} setName={setName} />
                  </div>
                  <div className="tarot-slot-face tarot-slot-front" aria-hidden="true" />
                </div>
              </li>
            ))}
          </ol>
          <div className="tarot-control-row" />
        </div>
      )}
      <p className="tarot-instruction text-center font-mono text-xs uppercase tracking-[0.2em] text-gold" aria-live="polite">
        {cards ? 'Reveal the cards in any order. Each glow reflects the rarity already locked inside.' : ''}
      </p>
    </section>
  )
}
