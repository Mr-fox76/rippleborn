'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PackOpening } from '@/components/pack-opening'
import { TarotCards, type FulfilledCard } from '@/components/pack-results'
import { RarityOdds } from '@/components/rarity-odds'
import { Button } from '@/components/ui/button'
import { XamanPaymentButton } from '@/components/xaman-payment-button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'
import { SAMPLE_CARDS, type PackCatalogEntry } from '@/lib/pack-catalog'
import type { CollectionStats } from '@/lib/pack-results'
import type { PackSetId } from '@/lib/rippleborn'
import { cn } from '@/lib/utils'

type Status = { tone: 'idle' | 'pending' | 'success' | 'error'; message: string }

type Order = {
  orderId: number
  setId: PackSetId
  buyer: string
  free?: boolean
  destinationAddress?: string
  destinationTag?: number
  amountDrops?: string
  priceXrp?: string
}

const READING_STAGES = [
  'Payment approved — starting your pack',
  'Selecting three cards from the collection',
  'Creating your collectible offers',
] as const

function ReadingProgress() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, READING_STAGES.length - 1))
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted/50 px-4 py-4" role="status" aria-live="polite">
      <div className="flex items-center justify-center gap-3 text-center">
        <Loader2 className="size-5 shrink-0 animate-spin text-gold" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            Preparing your reading
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{READING_STAGES[stage]}…</p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-md gap-2" aria-hidden="true">
        {READING_STAGES.map((label, index) => (
          <span
            key={label}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-500',
              index <= stage ? 'bg-gold' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Keep this page open. Your cards are being prepared and will appear here automatically.
      </p>
    </div>
  )
}

export function PackShop({
  collectionStats,
  pack,
  onActivityChange,
}: {
  collectionStats: CollectionStats
  pack: PackCatalogEntry
  /** Reports whether a pack is being prepared, paid, or revealed so parents can warn before navigating away. */
  onActivityChange?: (busy: boolean) => void
}) {
  const selectedSet = pack.id
  const router = useRouter()
  const { account } = useXamanWallet()
  const [order, setOrder] = useState<Order | null>(null)
  const [cards, setCards] = useState<FulfilledCard[] | null>(null)
  const [packOpened, setPackOpened] = useState(false)
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' })
  const [pending, setPending] = useState<'create' | 'fulfill' | null>(null)
  const purchasePanelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    onActivityChange?.(pending !== null || order !== null || cards !== null)
  }, [onActivityChange, pending, order, cards])

  useEffect(() => () => onActivityChange?.(false), [onActivityChange])

  useEffect(() => {
    if (!order) return
    const frame = window.requestAnimationFrame(() => {
      purchasePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [order])

  function resetDeck() {
    setOrder(null)
    setCards(null)
    setPackOpened(false)
    setStatus({ tone: 'idle', message: '' })
    setPending(null)
  }

  async function createOrder() {
    if (!account) {
      setStatus({ tone: 'error', message: 'Connect Xaman before preparing your pack.' })
      return
    }

    setPending('create')
    setCards(null)
    setPackOpened(false)
    setStatus({ tone: 'pending', message: 'Preparing your reading…' })

    try {
      const response = await fetch('/api/pack/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: account, setId: selectedSet }),
      })
      const data = await response.json()

      if (!response.ok) {
        setOrder(null)
        setStatus({ tone: 'error', message: data.error ?? 'Could not create the pack order.' })
        return
      }

      setOrder({
        orderId: data.orderId,
        setId: data.setId,
        buyer: account,
        destinationAddress: data.destinationAddress,
        destinationTag: data.destinationTag,
        amountDrops: data.amountDrops,
        priceXrp: data.priceXrp,
      })
      setStatus({
        tone: 'success',
        message: 'Pack prepared successfully. Continue below to approve the 5 XRP payment in Xaman.',
      })
    } catch {
      setStatus({ tone: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  async function fulfillOrder(transactionHash?: string, opts?: { order?: Order; free?: boolean }) {
    const activeOrder = opts?.order ?? order
    if (!activeOrder) {
      setStatus({ tone: 'error', message: 'Create a pack order first.' })
      return
    }

    setPending('fulfill')
    setStatus({ tone: 'pending', message: 'Preparing your cards…' })

    try {
      const response = await fetch('/api/pack/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          buyer: activeOrder.buyer,
          setId: activeOrder.setId,
          transactionHash,
          freeClaim: opts?.free ?? activeOrder.free ?? false,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus({ tone: 'error', message: data.error ?? 'Could not claim the pack.' })
        return
      }

      setCards(data.cards)
      setPackOpened(false)
      setStatus({ tone: 'success', message: 'The ledger has spoken. Open your sealed pack.' })
      router.refresh()
    } catch {
      setStatus({ tone: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  const statusColor =
    status.tone === 'error'
      ? 'text-destructive'
      : status.tone === 'success'
        ? 'text-gold'
        : 'text-muted-foreground'

  return (
    <div id="reading-table" className="mx-auto flex w-full flex-col items-center gap-2 sm:gap-3">
      <div className="pack-theme-intro flex w-full flex-col items-center gap-1.5 px-5 pt-3 pb-1 text-center sm:px-7">
        <h1 className="font-sans text-lg font-semibold tracking-tight text-balance sm:text-xl">
          <span className="pack-theme-accent">{pack.kicker.split(' ').at(-1)}</span>{' '}
          <span className="text-foreground">{pack.theme.blurb}</span>
        </h1>
        <p className="pack-theme-accent font-mono text-[0.65rem] uppercase tracking-[0.22em]">
          {pack.cardsPerPack} cards · {pack.priceXrp} XRP
        </p>
      </div>

      <div className="stable-opening-stage mx-auto w-full max-w-6xl">
        <div className="stable-opening-visual">
          <div
            className={`stable-opening-layer ${packOpened ? 'is-hidden' : 'is-active'}`}
            aria-hidden={packOpened}
          >
            <PackOpening
              canOpen={Boolean(cards)}
              packName={pack.name}
              packKicker={pack.kicker}
              packTitle={pack.packTitle}
              packImage={pack.coverImage}
              packCount={pack.cardsPerPack}
              preparationHint={!account ? 'Connect Xaman to begin' : 'Prepare your pack below to create the 5 XRP Xaman request'}
              onComplete={() => {
                setPackOpened(true)
                setStatus({ tone: 'success', message: 'Your cards are dealt. Turn them over one by one.' })
              }}
            />
          </div>
          <div
            className={`stable-opening-layer stable-card-layer ${packOpened ? 'is-active' : 'is-hidden'}`}
            aria-hidden={!packOpened}
          >
            <TarotCards
              cards={packOpened ? cards : null}
              buyer={order?.buyer ?? account}
              setName={pack.kicker}
              sampleCards={SAMPLE_CARDS[pack.id]}
              onReset={resetDeck}
            />
          </div>
        </div>

        <section
          ref={purchasePanelRef}
          aria-label="Open a pack"
          className="reading-panel stable-purchase-panel is-visible mx-auto flex w-full max-w-6xl flex-col gap-4 border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md sm:p-5"
        >
        <div className="pack-purchase-row mx-auto flex w-full max-w-xl items-center justify-center">
          {!order ? (
            <Button
              type="button"
              onClick={createOrder}
              disabled={!account || pending !== null}
              size="lg"
              className="primary-action min-h-14 w-full rounded-none px-6 font-mono text-sm font-semibold uppercase tracking-[0.12em] sm:rounded-md"
            >
              {pending === 'create' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {pending === 'create' ? 'Preparing Xaman request…' : 'Prepare pack · 5 XRP'}
            </Button>
          ) : order && account === order.buyer && !cards && !order.free ? (
            <XamanPaymentButton
              buyer={order.buyer}
              orderId={order.orderId}
              label={pending === 'fulfill' ? 'Preparing cards…' : 'Pay with Xaman'}
              disabled={pending !== null}
              onSubmitted={(transactionHash) => {
                setStatus({ tone: 'pending', message: 'Payment approved. Preparing your cards…' })
                void fulfillOrder(transactionHash)
              }}
            />
          ) : null}
        </div>

        <div className="pack-status-row" role="status" aria-live="polite">
          {pending === 'fulfill' ? (
            <ReadingProgress />
          ) : (
            <p className={`pack-status-message text-sm leading-relaxed ${statusColor}`}>
              {status.message || (account
                ? 'Prepare your pack and approve payment with Xaman. Once ready, click the pack itself to open it.'
                : '')}
            </p>
          )}
        </div>
        </section>
      </div>

      <aside className="reading-panel mx-auto w-full max-w-6xl border border-border p-4 backdrop-blur-md sm:p-5">
          <RarityOdds stats={collectionStats} setId={selectedSet} />
      </aside>
    </div>
  )
}
