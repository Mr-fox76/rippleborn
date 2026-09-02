'use client'

import Image from 'next/image'
import { Check, Copy, ExternalLink, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react'
import useSWR from 'swr'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { COLLECTION_CATALOG, getCollectionSlotKey, type CollectionCatalogSet } from '@/lib/collection-catalog'
import type { PackSetId } from '@/lib/rippleborn'

type CollectionCard = {
  tokenId: string
  image: string
  name: string
  rarity?: string
  discoveryNumber?: number
  discoveredTotal?: number
  cardIdentifier?: string
  setId?: PackSetId
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
    (card.cardIdentifier === undefined || /^PK\d{2}-S\d{2}-[A-Z]-\d{4}$/.test(card.cardIdentifier)) &&
    (card.setId === undefined || ['ledgerborn', 'cyborg-cowboy', 'chromatic-abyss'].includes(card.setId))
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
  const response = await fetch(url, { cache: 'no-store' })
  const data = (await response.json()) as CollectionResponse & { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'Unable to refresh this collection.')
  return data
}

function CollectionCardLightbox({
  card,
  onOpenChange,
}: {
  card: CollectionCard | null
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyTokenId() {
    if (!card) return
    await navigator.clipboard.writeText(card.tokenId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={card !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background p-4 sm:max-w-6xl sm:p-6">
        {card ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.5fr)] md:items-center">
            <div className="relative mx-auto aspect-[2/3] w-full max-w-2xl overflow-hidden rounded-md bg-card">
              <Image
                src={card.image}
                alt={`${card.name} NFT artwork`}
                fill
                unoptimized
                sizes="(max-width: 767px) calc(100vw - 4rem), 672px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-6">
              <DialogHeader>
                <DialogTitle className="font-sans text-2xl font-semibold leading-tight text-balance sm:text-3xl">
                  {card.name}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
                  {card.rarity?.trim() || 'Common'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Button render={<a href={`https://bithomp.com/nft/${card.tokenId}`} target="_blank" rel="noopener noreferrer" />} size="lg">
                  View on Bithomp
                  <ExternalLink data-icon="inline-end" aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={copyTokenId}>
                  <Copy data-icon="inline-start" aria-hidden="true" />
                  {copied ? 'NFT ID copied' : 'Copy NFT ID'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CollectionChecklist({
  set,
  ownedBySlot,
  rarityFilter,
  onCardSelect,
}: {
  set: CollectionCatalogSet
  ownedBySlot: Map<string, CollectionCard>
  rarityFilter: string
  onCardSelect: (card: CollectionCard) => void
}) {
  const visibleSlots = rarityFilter === 'all'
    ? set.slots
    : set.slots.filter((slot) => slot.rarity === rarityFilter)
  const owned = set.slots.filter((slot) => ownedBySlot.has(slot.key)).length

  return (
    <section className="rounded-md border border-border/70 bg-background/35 p-4 sm:p-5" aria-labelledby={`checklist-${set.id}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 id={`checklist-${set.id}`} className="font-sans text-lg font-semibold text-foreground">{set.label}</h2>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Set checklist</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold">{owned} owned · {set.slots.length - owned} missing</p>
      </div>
      {visibleSlots.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No {rarityFilter} slots in this set.</p>
      ) : (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {visibleSlots.map((slot) => {
          const card = ownedBySlot.get(slot.key)
          const rarityClass = `rarity-${slot.rarity.toLowerCase().replace(/[^a-z]+/g, '-')}`
          const content = (
            <div className={`collection-display-card group h-full overflow-hidden ${card ? '' : 'collection-display-card-missing'}`}>
              <div className="collection-display-art relative aspect-[2/3] overflow-hidden bg-background" data-card-name={slot.name}>
                {card ? (
                  <Image
                    src={card.image}
                    alt={`${slot.name} NFT artwork`}
                    fill
                    unoptimized
                    sizes="(max-width: 639px) calc(50vw - 2rem), (max-width: 1023px) calc(33vw - 2rem), 180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                ) : (
                  <div className="absolute inset-3 grid place-items-center rounded-sm border border-dashed border-border/70 bg-card/30" aria-hidden="true">
                    <span className="font-mono text-lg text-muted-foreground/55">{String(slot.position).padStart(2, '0')}</span>
                  </div>
                )}
                <div className="collection-card-caption flex items-end justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-xs font-semibold leading-tight text-foreground" title={slot.name}>{slot.name}</span>
                    <span className="collection-rarity-seal">{card ? 'Owned' : 'Missing'} · {slot.rarity}</span>
                  </div>
                  {card ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-sm border border-[color:var(--rarity-color)] text-[var(--rarity-color)]" aria-hidden="true">
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )

          return (
            <li key={slot.key} className={rarityClass}>
              {card ? (
                <button
                  type="button"
                  onClick={() => onCardSelect(card)}
                  className="block h-full w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View details for owned ${slot.name} NFT`}
                >
                  {content}
                </button>
              ) : content}
            </li>
          )
        })}
      </ul>
      )}
    </section>
  )
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
  const [setFilter, setSetFilter] = useState<'all' | PackSetId>('all')
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null)
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
  const visibleCards = cards.filter((card) =>
    (setFilter === 'all' || card.setId === setFilter) &&
    (rarityFilter === 'all' || (card.rarity?.trim() || 'Common') === rarityFilter),
  )
  const visibleCatalogs = setFilter === 'all'
    ? COLLECTION_CATALOG
    : COLLECTION_CATALOG.filter((set) => set.id === setFilter)
  const ownedBySlot = useMemo(() => {
    const map = new Map<string, CollectionCard>()
    for (const card of cards) {
      if (!card.setId) continue
      const key = getCollectionSlotKey(card.setId, card.name)
      if (!map.has(key)) map.set(key, card)
    }
    return map
  }, [cards])
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
                  {visibleCards.length === cards.length
                    ? `${cards.length} ${cards.length === 1 ? 'card' : 'cards'} on this wallet`
                    : `${visibleCards.length} of ${cards.length} cards`}
                </p>
                {rarityFilter !== 'all' ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRarityFilter('all')} className="ghost-action font-mono text-[0.65rem] uppercase tracking-[0.12em]">
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Select value={setFilter} onValueChange={(value) => setSetFilter((value ?? 'all') as 'all' | PackSetId)}>
                  <SelectTrigger size="sm" aria-label="Filter collection by set" className="collection-filter-trigger min-w-44 font-mono text-xs uppercase tracking-[0.12em]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" alignItemWithTrigger={false}>
                    <SelectGroup>
                      <SelectLabel>Filter by set</SelectLabel>
                      <SelectItem value="all">All sets</SelectItem>
                      {COLLECTION_CATALOG.map((set) => (
                        <SelectItem key={set.id} value={set.id}>{set.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-col gap-4">
              {visibleCatalogs.map((set) => (
                <CollectionChecklist
                  key={set.id}
                  set={set}
                  ownedBySlot={ownedBySlot}
                  rarityFilter={rarityFilter}
                  onCardSelect={setSelectedCard}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <CollectionCardLightbox
        card={selectedCard}
        onOpenChange={(open) => {
          if (!open) setSelectedCard(null)
        }}
      />
    </section>
  )
}
