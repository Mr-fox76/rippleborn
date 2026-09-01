'use client'

import Image from 'next/image'
import { ExternalLink, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react'
import useSWR from 'swr'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useXamanWallet } from '@/components/xaman-wallet-provider'
import { COLLECTION_REFRESH_EVENT } from '@/lib/collection-refresh'

type CollectionCard = {
  tokenId: string
  image: string
  name: string
  rarity?: string
  discoveryNumber?: number
  discoveredTotal?: number
  cardIdentifier?: string
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
    (card.rarity === undefined || typeof card.rarity === 'string') &&
    (card.discoveryNumber === undefined || Number.isInteger(card.discoveryNumber)) &&
    (card.discoveredTotal === undefined || Number.isInteger(card.discoveredTotal)) &&
    (card.cardIdentifier === undefined || /^PK\d{2}-S\d{2}-[A-Z]-\d{4}$/.test(card.cardIdentifier))
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

export function WalletCollection({ compact = false }: { compact?: boolean }) {
  const { account } = useXamanWallet()
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const key = hydrated && account ? `/api/collection?owner=${encodeURIComponent(account)}` : null
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetchCollection, {
    fallbackData: hydrated && account ? { cards: readCachedCards(account) ?? [] } : undefined,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: (freshData) => {
      if (!account || !freshData.cards.every(isCollectionCard)) return
      window.localStorage.setItem(`${CACHE_PREFIX}${account}`, JSON.stringify(freshData.cards))
    },
  })

  useEffect(() => {
    if (!account) return

    const retries: number[] = []
    function refreshAfterClaim(event: Event) {
      const detail = (event as CustomEvent<{ account?: string }>).detail
      if (detail?.account !== account) return

      void mutate()
      retries.push(
        ...[2500, 6000, 12000].map((delay) =>
          window.setTimeout(() => void mutate(), delay),
        ),
      )
    }

    window.addEventListener(COLLECTION_REFRESH_EVENT, refreshAfterClaim)
    return () => {
      window.removeEventListener(COLLECTION_REFRESH_EVENT, refreshAfterClaim)
      retries.forEach(window.clearTimeout)
    }
  }, [account, mutate])

  const cards = data?.cards ?? []
  const [rarityFilter, setRarityFilter] = useState('all')
  const rarityOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of cards) {
      const rarity = card.rarity?.trim() || 'Common'
      counts.set(rarity, (counts.get(rarity) ?? 0) + 1)
    }
    return Array.from(counts, ([rarity, count]) => ({ rarity, count })).sort((a, b) =>
      a.rarity.localeCompare(b.rarity),
    )
  }, [cards])
  const filteredCards = rarityFilter === 'all'
    ? cards
    : cards.filter((card) => (card.rarity?.trim() || 'Common') === rarityFilter)
  const isInitialLoading = Boolean(account && isLoading && cards.length === 0)

  return (
    <section aria-labelledby="collection-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {compact ? (
        <h2 id="collection-heading" className="sr-only">Your collection</h2>
      ) : (
        <div className="flex flex-col gap-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold">On-ledger archive</p>
          <h1 id="collection-heading" className="font-sans text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Collection
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Cards currently held by your connected XRP Ledger wallet, read directly from Mainnet.
          </p>
        </div>
      )}

      <div className="qr-panel collection-panel min-h-[28rem] p-4 sm:p-6 lg:p-8" aria-live="polite" aria-busy={isLoading || isValidating}>
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
              <div className="flex items-center gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {filteredCards.length === cards.length
                    ? `${cards.length} ${cards.length === 1 ? 'card' : 'cards'} on this wallet`
                    : `${filteredCards.length} of ${cards.length} cards`}
                </p>
                {rarityFilter !== 'all' ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRarityFilter('all')} className="ghost-action font-mono text-[0.65rem] uppercase tracking-[0.12em]">
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Select value={rarityFilter} onValueChange={(value) => setRarityFilter(value ?? 'all')}>
                  <SelectTrigger size="sm" aria-label="Filter collection by rarity" className="collection-filter-trigger min-w-40 font-mono text-xs uppercase tracking-[0.12em]">
                    <SlidersHorizontal aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" alignItemWithTrigger={false}>
                    <SelectGroup>
                      <SelectLabel>Filter by rarity</SelectLabel>
                      <SelectItem value="all">
                        <span>All cards</span>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">{cards.length}</span>
                      </SelectItem>
                      {rarityOptions.map(({ rarity, count }) => (
                        <SelectItem key={rarity} value={rarity}>
                          <span className={`collection-filter-dot rarity-${rarity.toLowerCase().replace(/[^a-z]+/g, '-')}`} aria-hidden="true" />
                          <span>{rarity}</span>
                          <span className="ml-auto font-mono text-xs text-muted-foreground">{count}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={() => mutate()} disabled={isValidating} className="ghost-action font-mono text-xs uppercase tracking-[0.12em]">
                  <RefreshCw className={`size-4 ${isValidating ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {isValidating ? 'Refreshing' : 'Refresh'}
                </Button>
              </div>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">Showing your saved grid. {error.message}</p> : null}
            {filteredCards.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
                <h2 className="font-sans text-lg font-semibold text-foreground">No {rarityFilter} cards in this collection.</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setRarityFilter('all')}>Show all cards</Button>
              </div>
            ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {filteredCards.map((card) => {
                const rarityClass = card.rarity
                  ? `rarity-${card.rarity.toLowerCase().replace(/[^a-z]+/g, '-')}`
                  : 'rarity-common'

                return (
                  <li key={card.tokenId} className={rarityClass}>
                    <a
                      href={`https://bithomp.com/nft/${card.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="collection-display-card group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="collection-display-art relative aspect-[2/3] overflow-hidden bg-background" data-card-name={card.name}>
                        <Image src={card.image} alt={`${card.name} NFT artwork`} fill quality={70} sizes="(max-width: 639px) calc(50vw - 1.5rem), (max-width: 1023px) calc(25vw - 1.5rem), 280px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                        <div className="collection-display-sheen" aria-hidden="true" />
                        {card.cardIdentifier ? (
                          <span className="collection-discovery-mark" aria-label={`Card identifier ${card.cardIdentifier}`}>
                            {card.cardIdentifier}
                          </span>
                        ) : null}
                        <span className="collection-edition-mark" aria-hidden="true">LB</span>
                        <div className="collection-card-caption flex items-end justify-between gap-2">
                          <div className="flex min-w-0 flex-col gap-1">
                            <h2 className="text-pretty text-sm font-semibold leading-snug text-foreground">{card.name}</h2>
                            <span className="collection-rarity-seal">{card.rarity ?? 'Common'}</span>
                          </div>
                          <ExternalLink className="size-4 shrink-0 text-foreground/70 transition-colors group-hover:text-[var(--rarity-color)]" aria-hidden="true" />
                        </div>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
