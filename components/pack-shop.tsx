'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gem, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { CardStylePreview } from '@/components/card-style-preview'
import { PackOpening } from '@/components/pack-opening'
import { TarotCards, type FulfilledCard } from '@/components/pack-results'
import { RarityOdds } from '@/components/rarity-odds'
import { Button } from '@/components/ui/button'
import { XamanPaymentButton } from '@/components/xaman-payment-button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'
import type { PackCatalogEntry } from '@/lib/pack-catalog'
import type { CollectionStats } from '@/lib/pack-results'
import type { PackSetId } from '@/lib/rippleborn'
import { cn } from '@/lib/utils'

type Status = { tone: 'idle' | 'pending' | 'success' | 'error'; message: string }

type Order = {
  orderId: number
  setId: PackSetId
  buyer: string
  destinationAddress: string
  destinationTag: number
  amountDrops: string
  priceXrp: string
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
}: {
  collectionStats: CollectionStats
  pack: PackCatalogEntry
}) {
  const selectedSet = pack.id
  const router = useRouter()
  const { account } = useXamanWallet()
  const [order, setOrder] = useState<Order | null>(null)
  const [cards, setCards] = useState<FulfilledCard[] | null>(null)
  const [packOpened, setPackOpened] = useState(false)
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' })
  const [pending, setPending] = useState<'create' | 'fulfill' | null>(null)

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
        message: 'Your pack is ready. Scan the Xaman QR code or open Xaman to approve the payment.',
      })
    } catch {
      setStatus({ tone: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  async function fulfillOrder(transactionHash?: string) {
    if (!order) {
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
          orderId: order.orderId,
          buyer: order.buyer,
          setId: order.setId,
          transactionHash,
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
    <div id="reading-table" className="mx-auto flex w-full flex-col items-center gap-5 sm:gap-6">
      <div className="pack-theme-intro mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-center lg:text-left">
          <p className="pack-theme-accent font-mono text-[0.65rem] uppercase tracking-[0.32em]">
            {pack.theme.eyebrow}
          </p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {pack.theme.title}
          </h1>
          <p className="font-sans text-base font-medium text-pretty text-foreground sm:text-lg">
            {pack.theme.tagline}
          </p>
          <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {pack.theme.introduction}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 lg:items-end">
          <div className="flex max-w-xl flex-wrap justify-center gap-2 lg:justify-end">
            {pack.theme.features.map((feature, index) => {
              const Icon = [Sparkles, Gem, ShieldCheck][index]
              return (
                <span key={feature} className="inline-flex items-center gap-2 interface-chip rounded-full border px-3 py-1.5 text-xs text-foreground">
                  <Icon className="pack-theme-accent size-3.5" aria-hidden="true" />
                  {feature}
                </span>
              )
            })}
          </div>
          <p className="pack-theme-accent text-center font-mono text-[0.65rem] uppercase tracking-[0.22em] lg:text-right">
            Three collectible NFTs · One immersive opening · {pack.priceXrp} XRP
          </p>
        </div>
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
              packImage={pack.packImage}
              packCount={pack.cardsPerPack}
              preparationHint={!account ? 'Connect Xaman to begin' : 'Ready for your wallet approval'}
              preparationAction={!order ? (
                <Button
                  onClick={createOrder}
                  disabled={!account || pending !== null}
                  size="lg"
                  className="primary-action min-h-12 w-full rounded-none px-6 font-mono text-sm font-semibold uppercase tracking-[0.12em] sm:rounded-md"
                >
                  {pending === 'create' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending === 'create' ? 'Preparing…' : 'Prepare pack'}
                </Button>
              ) : undefined}
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
              buyer={order?.buyer ?? null}
              setName={pack.kicker}
              onReset={resetDeck}
            />
          </div>
        </div>

        {order ? (
        <section
          aria-label="Open a pack"
          className="reading-panel mx-auto flex w-full max-w-6xl flex-col gap-4 border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md sm:p-5"
        >
        <div className="pack-purchase-row mx-auto flex w-full max-w-xl items-center justify-center">
          {account === order.buyer && !cards ? (
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
                : 'Connect Xaman to begin.')}
            </p>
          )}
        </div>
        </section>
        ) : null}
      </div>

      <CardStylePreview theme={pack.theme.id} />

      <aside className="reading-panel mx-auto w-full max-w-6xl border border-border p-4 backdrop-blur-md sm:p-5">
          <RarityOdds stats={collectionStats} setId={selectedSet} />
      </aside>
    </div>
  )
}
