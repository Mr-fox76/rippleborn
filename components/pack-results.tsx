'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimNftButton } from '@/components/claim-nft-button'
import type { Card } from '@/lib/rippleborn'

export type FulfilledCard = Card & {
  mintStatus?: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  reason?: string
}

const RARITY_CLASSES: Record<Card['rarity'], string> = {
  Common: 'rarity-common',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
  Mythic: 'rarity-mythic',
}

function CardDetails({ card }: { card: FulfilledCard }) {
  if (card.mintStatus === 'minted') {
    return (
      <details className="mt-2 text-left font-mono text-[0.65rem] text-muted-foreground">
        <summary className="cursor-pointer uppercase tracking-wider">On-chain details</summary>
        <dl className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
          <div>
            <dt>NFT</dt>
            <dd className="break-all">{card.nftId}</dd>
          </div>
          <div>
            <dt>Offer</dt>
            <dd className="break-all">{card.offerId}</dd>
          </div>
        </dl>
      </details>
    )
  }

  if (card.mintStatus) {
    return (
      <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
        {card.mintStatus === 'skipped' ? 'Mint skipped: ' : 'Mint failed: '}
        {card.reason}
      </p>
    )
  }

  return null
}

function FaceDownCard({ index, onReveal }: { index: number; onReveal?: () => void }) {
  const content = (
    <div className="tarot-back-inner">
      <span className="celestial-orbit" aria-hidden="true">
        <span className="celestial-core" />
      </span>
      <span className="celestial-card-name" aria-hidden="true">Rippleborn</span>
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
      className="tarot-card tarot-back tarot-reveal-button"
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
    if (revealing !== null || index !== revealed.size) return
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
      <ol className="tarot-spread mx-auto flex w-full max-w-4xl items-start justify-center gap-3 sm:gap-7">
        {[0, 1, 2].map((index) => {
        const card = cards[index]
        const isRevealed = revealed.has(index)

        return (
          <li
            key={card?.id ?? index}
            className={`tarot-slot tarot-arrival min-w-0 flex-1 ${revealing === index ? 'is-revealing' : ''} ${revealed.size === cards.length ? 'is-collected' : ''}`}
            style={{ '--arrival-index': index } as CSSProperties}
          >
            {card && isRevealed ? (
              <article
                className={`tarot-card tarot-reveal ${RARITY_CLASSES[card.rarity]} ${card.limited ? 'phoenix-reveal' : ''} overflow-hidden border bg-card shadow-2xl`}
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  <Image
                    src={card.image}
                    alt={`${card.name}, ${card.rarity} card`}
                    fill
                    priority
                    sizes="(max-width: 640px) 30vw, 220px"
                    className="object-cover"
                  />
                  {card.limited && card.edition && card.maxSupply ? (
                    <span className="phoenix-edition absolute right-2 top-2 z-10 rounded-full border px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] sm:right-3 sm:top-3 sm:text-xs">
                      Edition {card.edition}/{card.maxSupply}
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/85 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
                    <p className="font-sans text-sm font-semibold leading-tight text-card-foreground text-pretty sm:text-base">
                      {card.name}
                    </p>
                    <p className="rarity-badge mt-2 inline-flex rounded-full border px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] sm:text-xs">
                      {card.rarity}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <CardDetails card={card} />
                  {card.mintStatus === 'minted' && card.nftId && card.offerId && buyer ? (
                    <ClaimNftButton
                      buyer={buyer}
                      nftId={card.nftId}
                      offerId={card.offerId}
                      onClaimed={markClaimed}
                    />
                  ) : null}
                </div>
              </article>
            ) : (
              <FaceDownCard
                index={index}
                onReveal={card && index === revealed.size && revealing === null ? () => revealCard(index) : undefined}
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
        <ol className="tarot-spread mx-auto flex w-full max-w-4xl items-start justify-center gap-3 sm:gap-7">
          {[0, 1, 2].map((index) => (
            <li key={index} className="tarot-slot min-w-0 flex-1">
              <FaceDownCard index={index} />
            </li>
          ))}
        </ol>
      )}
      {cards ? (
        <p className="mt-5 text-center font-mono text-xs uppercase tracking-[0.2em] text-gold" aria-live="polite">
          Reveal the cards in order. Each one carries its own fate.
        </p>
      ) : null}
    </section>
  )
}
