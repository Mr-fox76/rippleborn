import Image from 'next/image'
import { ClaimNftButton } from '@/components/claim-nft-button'
import type { Card } from '@/lib/rippleborn'

export type FulfilledCard = Card & {
  mintStatus?: 'minted' | 'skipped' | 'failed'
  nftId?: string
  offerId?: string
  reason?: string
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

export function TarotCards({
  cards,
  buyer,
}: {
  cards: FulfilledCard[] | null
  buyer: string | null
}) {
  return (
    <section aria-label={cards ? 'Your revealed cards' : 'Three face-down cards'}>
      <ol className="tarot-spread mx-auto flex w-full max-w-4xl items-start justify-center gap-3 sm:gap-7">
        {[0, 1, 2].map((index) => {
          const card = cards?.[index]

          return (
            <li key={card?.id ?? index} className="tarot-slot min-w-0 flex-1">
              {card ? (
                <article className="tarot-card tarot-reveal overflow-hidden border border-gold/55 bg-card shadow-2xl">
                  <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    <Image
                      src={card.image}
                      alt={`${card.name}, ${card.rarity} card`}
                      fill
                      priority
                      sizes="(max-width: 640px) 30vw, 220px"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/85 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
                      <p className="font-sans text-sm font-semibold leading-tight text-card-foreground text-pretty sm:text-base">
                        {card.name}
                      </p>
                      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold sm:text-xs">
                        {card.rarity}
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <CardDetails card={card} />
                    {card.mintStatus === 'minted' && card.nftId && card.offerId && buyer ? (
                      <ClaimNftButton buyer={buyer} nftId={card.nftId} offerId={card.offerId} />
                    ) : null}
                  </div>
                </article>
              ) : (
                <div className="tarot-card tarot-back" aria-label={`Face-down card ${index + 1}`}>
                  <div className="tarot-back-inner">
                    <span className="tarot-orbit" aria-hidden="true" />
                    <span className="tarot-moon" aria-hidden="true" />
                    <span className="sr-only">Face-down card {index + 1}</span>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
