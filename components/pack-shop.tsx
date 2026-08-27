'use client'

import { useState } from 'react'
import { Loader2, Package, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PackResults } from '@/components/pack-results'
import { RarityOdds } from '@/components/rarity-odds'
import { CARDS_PER_PACK, PACK_PRICE_XRP, type Card } from '@/lib/rippleborn'

type Status = { tone: 'idle' | 'pending' | 'success' | 'error'; message: string }

type Order = {
  orderId: number
  destinationAddress: string
  destinationTag: number
  amountDrops: string
  priceXrp: string
}

export function PackShop() {
  const [buyer, setBuyer] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [cards, setCards] = useState<Card[] | null>(null)
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' })
  const [pending, setPending] = useState<'create' | 'fulfill' | null>(null)

  async function createOrder() {
    setPending('create')
    setCards(null)
    setStatus({ tone: 'pending', message: 'Reserving your pack…' })

    try {
      const res = await fetch('/api/pack/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOrder(null)
        setStatus({ tone: 'error', message: data.error ?? 'Could not create the pack order.' })
        return
      }

      setOrder({
        orderId: data.orderId,
        destinationAddress: data.destinationAddress,
        destinationTag: data.destinationTag,
        amountDrops: data.amountDrops,
        priceXrp: data.priceXrp,
      })
      setStatus({
        tone: 'success',
        message: `Order ${data.orderId} reserved. Send exactly ${data.priceXrp} XRP with the destination tag below.`,
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
    setStatus({ tone: 'pending', message: 'Verifying payment and opening your pack…' })

    try {
      const res = await fetch('/api/pack/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, buyer }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ tone: 'error', message: data.error ?? 'Could not fulfill the order.' })
        return
      }

      setCards(data.cards)
      setStatus({ tone: 'success', message: `Pack opened. ${data.cards.length} cards pulled.` })
    } catch {
      setStatus({ tone: 'error', message: 'Network error. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  const statusTone =
    status.tone === 'error'
      ? 'text-destructive'
      : status.tone === 'success'
        ? 'text-primary'
        : 'text-muted-foreground'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Product panel */}
      <section
        aria-label="Booster pack"
        className="relative flex flex-1 flex-col gap-8 overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-balance">
                Genesis Booster
              </h2>
              <p className="text-sm text-muted-foreground">
                {CARDS_PER_PACK} XRPL NFTs, minted straight to your wallet.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-gold/40 px-3 py-1 font-mono text-xs text-gold">
              {PACK_PRICE_XRP} XRP
            </span>
          </div>

          {/* Pack artwork stand-in: three stacked card silhouettes */}
          <div className="flex items-end justify-center gap-3 py-4" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex h-32 w-20 items-center justify-center rounded-md border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent sm:h-40 sm:w-24"
                style={{ transform: `translateY(${i === 1 ? '-12px' : '0'})` }}
              >
                <Package className="size-6 text-primary/50" />
              </div>
            ))}
          </div>

          <RarityOdds />
        </div>
      </section>

      {/* Checkout panel */}
      <section
        aria-label="Open a pack"
        className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="xrpl-address"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            XRPL address
          </label>
          <input
            id="xrpl-address"
            name="xrpl-address"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder="r..."
            autoComplete="off"
            spellCheck={false}
            aria-describedby="address-hint"
            className="w-full rounded-md border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <p id="address-hint" className="text-xs text-muted-foreground">
            Cards are minted to this address. Never share your seed or private key.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={createOrder}
            disabled={pending !== null}
            className="flex-1 bg-primary font-medium text-primary-foreground hover:bg-primary/90"
          >
            {pending === 'create' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Create pack order
          </Button>

          <Button
            onClick={fulfillOrder}
            disabled={pending !== null}
            variant="outline"
            className="flex-1 border-gold/50 bg-transparent font-medium text-gold hover:bg-gold/10 hover:text-gold"
          >
            {pending === 'fulfill' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            Fulfill after payment
          </Button>
        </div>

        {/* Status message area */}
        <div
          role="status"
          aria-live="polite"
          className="min-h-12 rounded-md border border-border bg-background px-4 py-3"
        >
          <p className={`text-sm leading-relaxed ${statusTone}`}>
            {status.message || 'Enter your XRPL address to begin.'}
          </p>
          {order ? (
            <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
              <div className="flex flex-col gap-1">
                <dt className="uppercase tracking-wider">Destination</dt>
                <dd className="break-all text-foreground">{order.destinationAddress}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <dt className="uppercase tracking-wider">Amount</dt>
                  <dd className="text-foreground">
                    {order.amountDrops} drops ({order.priceXrp} XRP)
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider">Destination tag</dt>
                  <dd className="text-foreground">{order.destinationTag}</dd>
                </div>
              </div>
            </dl>
          ) : null}
        </div>

        </section>
      </div>

      {cards ? <PackResults cards={cards} /> : null}
    </div>
  )
}
