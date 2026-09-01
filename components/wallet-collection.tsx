'use client'

import Image from 'next/image'
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { useSyncExternalStore } from 'react'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { Button } from '@/components/ui/button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

type CollectionCard = {
  tokenId: string
  image: string
  name: string
  rarity?: string
}

type CollectionResponse = {
  cards: CollectionCard[]
}

const CACHE_PREFIX = 'ledgerborn:collection:'

function isCollectionCard(value: unknown): value is CollectionCard {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<CollectionCard>
  return (
    typeof card.tokenId === 'string' &&
    /^[A-F0-9]{64}$/i.test(card.tokenId) &&
    typeof card.image === 'string' &&
    card.image.startsWith('/api/collection?media=') &&
    typeof card.name === 'string' &&
    card.name.trim().length > 0 &&
    (card.rarity === undefined || typeof card.rarity === 'string')
  )
}

function readCachedCards(account: string): CollectionCard[] | undefined {
  try {
    const cached = window.localStorage.getItem(`${CACHE_PREFIX}${account}`)
    if (!cached) return undefined
    const parsed: unknown = JSON.parse(cached)
    return Array.isArray(parsed) && parsed.every(isCollectionCard) ? parsed : undefined
  } catch {
    return undefined
  }
}

async function fetchCollection(url: string): Promise<CollectionResponse> {
  const response = await fetch(url)
  const data = (await response.json()) as CollectionResponse & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Unable to refresh this collection.')
  return data
}

export function WalletCollection() {
  const { account } = useXamanWallet()
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const key = hydrated && account ? `/api/collection?owner=${encodeURIComponent(account)}` : null
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetchCollection, {
    fallbackData: hydrated && account ? { cards: readCachedCards(account) ?? [] } : undefined,
    revalidateOnFocus: false,
    onSuccess: (freshData) => {
      if (!account || !freshData.cards.every(isCollectionCard)) return
      window.localStorage.setItem(`${CACHE_PREFIX}${account}`, JSON.stringify(freshData.cards))
    },
  })
  const cards = data?.cards ?? []
  const isInitialLoading = Boolean(account && isLoading && cards.length === 0)

  return (
    <section aria-labelledby="collection-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold">On-ledger archive</p>
        <h1 id="collection-heading" className="font-sans text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          Collection
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Cards currently held by your connected XRP Ledger wallet, read directly from Mainnet.
        </p>
      </div>

      <div className="qr-panel min-h-[28rem] border border-border/70 p-4 sm:p-6 lg:p-8" aria-live="polite" aria-busy={isLoading || isValidating}>
        {!account ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-6 text-center">
            <div className="flex max-w-lg flex-col gap-2">
              <h2 className="font-sans text-xl font-semibold text-foreground">Connect Xaman to see cards you claimed.</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">Your public wallet address is used only to read its Ledgerborn NFTs.</p>
            </div>
            <ConnectWalletButton />
          </div>
        ) : isInitialLoading ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-7 animate-spin text-gold" aria-hidden="true" />
            <h2 className="font-sans text-xl font-semibold text-foreground">Reading your collection</h2>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">XRP Ledger Mainnet</p>
          </div>
        ) : error && cards.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-5 text-center">
            <div className="flex max-w-lg flex-col gap-2">
              <h2 className="font-sans text-xl font-semibold text-foreground">Collection unavailable</h2>
              <p role="alert" className="text-sm leading-relaxed text-muted-foreground">{error.message}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => mutate()} className="ghost-action font-mono text-xs uppercase tracking-[0.14em]">
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center">
            <h2 className="font-sans text-xl font-semibold text-foreground">No Ledgerborn cards on this wallet yet.</h2>
            <p className="text-sm text-muted-foreground">Claim a card offer, then refresh this collection.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'} on this wallet
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => mutate()} disabled={isValidating} className="ghost-action font-mono text-xs uppercase tracking-[0.12em]">
                <RefreshCw className={`size-4 ${isValidating ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isValidating ? 'Refreshing' : 'Refresh'}
              </Button>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">Showing your saved grid. {error.message}</p> : null}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => {
                const rarityClass = card.rarity
                  ? `rarity-${card.rarity.toLowerCase().replace(/[^a-z]+/g, '-')}`
                  : 'rarity-common'

                return (
                  <li key={card.tokenId} className={rarityClass}>
                    <a
                      href={`https://bithomp.com/nft/${card.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="collection-display-card group flex h-full flex-col p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="collection-card-rail" aria-hidden="true" />
                      <div className="collection-display-art relative aspect-[2/3] overflow-hidden bg-background">
                        <Image src={card.image} alt={`${card.name} NFT artwork`} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                        <div className="collection-display-sheen" aria-hidden="true" />
                        {card.rarity ? <span className="collection-rarity-badge">{card.rarity}</span> : null}
                      </div>
                      <div className="collection-display-plaque flex min-h-20 items-start justify-between gap-2 px-2 pb-1 pt-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <h2 className="text-pretty text-sm font-semibold leading-snug text-foreground">{card.name}</h2>
                          <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">Ledgerborn archive</p>
                        </div>
                        <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[var(--rarity-color)]" aria-hidden="true" />
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
