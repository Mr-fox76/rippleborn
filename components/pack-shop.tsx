'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gem, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { PackOpening } from '@/components/pack-opening'
import { TarotCards, type FulfilledCard } from '@/components/pack-results'
import { RarityOdds } from '@/components/rarity-odds'
import { Button } from '@/components/ui/button'
import { XamanPaymentButton } from '@/components/xaman-payment-button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'
import type { CollectionStats } from '@/lib/pack-results'

type Status = { tone: 'idle' | 'pending' | 'success' | 'error'; message: string }

type Order = {
  orderId: number
  buyer: string
  destinationAddress: string
  destinationTag: number
  amountDrops: string
  priceXrp: string
}

export function PackShop({ collectionStats }: { collectionStats: CollectionStats }) {
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
        body: JSON.stringify({ buyer: account }),
      })
      const data = await response.json()

      if (!response.ok) {
        setOrder(null)
        setStatus({ tone: 'error', message: data.error ?? 'Could not create the pack order.' })
        return
      }

      setOrder({
        orderId: data.orderId,
        buyer: account,
        destinationAddress: data.destinationAddress,
        destinationTag: data.destinationTag,
        amountDrops: data.amountDrops,
        priceXrp: data.priceXrp,
      })
      setStatus({
        tone: 'success',
        message: `Send exactly ${data.priceXrp} XRP with the destination tag below.`,
      })
    } catch {
      setStatus({ tone: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  async function fulfillOrder() {
    if (!order) {
      setStatus({ tone: 'error', message: 'Create a pack order first.' })
      return
    }

    setPending('fulfill')
    setStatus({ tone: 'pending', message: 'Reading the ledger…' })

    try {
      const response = await fetch('/api/pack/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, buyer: order.buyer }),
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
    <div id="reading-table" className="mx-auto flex w-full flex-col gap-7 sm:gap-9">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-gold">
          Digital pack opening. Real NFT ownership.
        </p>
        <h1 className="max-w-2xl font-sans text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Chase the rare. Reveal the extraordinary. Mint what you pull.
        </h1>
        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Enter a collection inspired by mythical characters, legendary beings, and ancient powers.
          Each pack holds three unique cards—from sought-after rarities to strictly limited editions—and
          turns every dramatic reveal into a real NFT on the XRP Ledger, ready to mint, claim, trade,
          and build into a collection that is truly yours.
        </p>
        <div className="flex max-w-2xl flex-wrap justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-2 interface-chip rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            One-by-one reveals
          </span>
          <span className="inline-flex items-center gap-2 interface-chip rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
            <Gem className="size-3.5 text-primary" aria-hidden="true" />
            Real rarity, including limited pulls
          </span>
          <span className="inline-flex items-center gap-2 interface-chip rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Minted and claimed on XRPL
          </span>
        </div>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-gold">
          Three collectible NFTs · One immersive opening · 5 XRP
        </p>
      </div>

      {!cards ? (
        <PackOpening canOpen={false} />
      ) : !packOpened ? (
        <PackOpening
          onComplete={() => {
            setPackOpened(true)
            setStatus({ tone: 'success', message: 'Your cards are dealt. Turn them over one by one.' })
          }}
        />
      ) : (
        <TarotCards cards={cards} buyer={order?.buyer ?? null} onReset={resetDeck} />
      )}

      <section
        aria-label="Open a pack"
        className="reading-panel mx-auto flex w-full max-w-xl flex-col gap-4 border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Button
            onClick={createOrder}
            disabled={!account || pending !== null || order !== null}
            size="lg"
            className="primary-action h-16 w-full flex-1 px-8 font-mono text-base font-semibold uppercase tracking-[0.12em] sm:h-12 sm:text-sm"
          >
            {pending === 'create' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Prepare pack
          </Button>

          {order && account === order.buyer && !cards ? (
            <XamanPaymentButton
              buyer={order.buyer}
              orderId={order.orderId}
              label={pending === 'fulfill' ? 'Opening pack…' : 'Open pack'}
              disabled={pending !== null}
              onSubmitted={() => {
                setStatus({ tone: 'pending', message: 'Payment received. Reading the ledger…' })
                window.setTimeout(() => void fulfillOrder(), 2500)
              }}
            />
          ) : (
            <Button
              disabled
              variant="outline"
              size="lg"
              className="ghost-action h-16 w-full flex-1 px-8 font-mono text-base font-semibold uppercase tracking-[0.12em] sm:h-12 sm:text-sm"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Open pack
            </Button>
          )}
        </div>

        <div role="status" aria-live="polite" className="min-h-5 text-center">
          <p className={`text-sm leading-relaxed ${statusColor}`}>
            {status.message || (account ? 'Prepare your pack, then open it securely with Xaman.' : 'Connect Xaman to begin.')}
          </p>
        </div>
      </section>

      <aside className="reading-panel mx-auto w-full max-w-xl border border-border p-4 backdrop-blur-md sm:p-5">
          <RarityOdds stats={collectionStats} />
      </aside>
    </div>
  )
}
