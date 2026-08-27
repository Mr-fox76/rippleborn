'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { PackOpening } from '@/components/pack-opening'
import { TarotCards, type FulfilledCard } from '@/components/pack-results'
import { Button } from '@/components/ui/button'
import { XamanPaymentButton } from '@/components/xaman-payment-button'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

type Status = { tone: 'idle' | 'pending' | 'success' | 'error'; message: string }

type Order = {
  orderId: number
  buyer: string
  destinationAddress: string
  destinationTag: number
  amountDrops: string
  priceXrp: string
}

export function PackShop() {
  const { account } = useXamanWallet()
  const [buyer, setBuyer] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [cards, setCards] = useState<FulfilledCard[] | null>(null)
  const [packOpened, setPackOpened] = useState(false)
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' })
  const [pending, setPending] = useState<'create' | 'fulfill' | null>(null)

  const activeBuyer = account ?? buyer.trim()

  async function createOrder() {
    setPending('create')
    setCards(null)
    setPackOpened(false)
    setStatus({ tone: 'pending', message: 'Preparing your reading…' })

    try {
      const response = await fetch('/api/pack/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: activeBuyer }),
      })
      const data = await response.json()

      if (!response.ok) {
        setOrder(null)
        setStatus({ tone: 'error', message: data.error ?? 'Could not create the pack order.' })
        return
      }

      setOrder({
        orderId: data.orderId,
        buyer: activeBuyer,
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
          Genesis reading
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Draw three from the ledger
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">Three XRPL NFTs · 5 XRP</p>
      </div>

      {cards && !packOpened ? (
        <PackOpening
          onComplete={() => {
            setPackOpened(true)
            setStatus({ tone: 'success', message: 'Choose each card to reveal your pull.' })
          }}
        />
      ) : (
        <TarotCards cards={packOpened ? cards : null} buyer={order?.buyer ?? null} />
      )}

      <section
        aria-label="Open a pack"
        className="reading-panel mx-auto flex w-full max-w-xl flex-col gap-4 border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md sm:p-5"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="xrpl-address"
            className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Receiving wallet
          </label>
          <input
            id="xrpl-address"
            name="xrpl-address"
            value={account ?? buyer}
            onChange={(event) => setBuyer(event.target.value)}
            placeholder="r..."
            disabled={order !== null || account !== null}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="address-hint"
            className="w-full rounded-md border border-input bg-background/70 px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <p id="address-hint" className="text-xs text-muted-foreground">
            {account
              ? 'Connected with Xaman. This wallet will pay and receive the cards.'
              : 'Use the same wallet to pay and receive the cards. Never share your seed.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={createOrder}
            disabled={pending !== null || order !== null}
            className="flex-1 bg-primary font-medium text-primary-foreground hover:bg-primary/90"
          >
            {pending === 'create' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Prepare reading
          </Button>
          <Button
            onClick={fulfillOrder}
            disabled={pending !== null || order === null || cards !== null}
            variant="outline"
            className="flex-1 border-gold/50 bg-transparent font-medium text-gold hover:bg-gold/10 hover:text-gold"
          >
            {pending === 'fulfill' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            Reveal cards
          </Button>
        </div>

        <div role="status" aria-live="polite" className="min-h-5 text-center">
          <p className={`text-sm leading-relaxed ${statusColor}`}>
            {status.message || 'Enter your XRPL address to begin.'}
          </p>
        </div>

        {order && account === order.buyer && !cards ? (
          <XamanPaymentButton
            buyer={order.buyer}
            orderId={order.orderId}
            onSubmitted={(transactionHash) =>
              setStatus({
                tone: 'success',
                message: transactionHash
                  ? 'Payment submitted to XRPL. Wait a few seconds, then reveal your cards.'
                  : 'Payment submitted. Wait a few seconds, then reveal your cards.',
              })
            }
          />
        ) : null}

        {order ? (
          <details className="rounded-md border border-border bg-background/55 px-3 py-2.5 font-mono text-xs text-muted-foreground" open>
            <summary className="cursor-pointer uppercase tracking-[0.16em] text-foreground">
              Payment details
            </summary>
            <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex flex-col gap-1">
                <dt className="uppercase tracking-wider">Pay from</dt>
                <dd className="break-all text-foreground">{order.buyer}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="uppercase tracking-wider">Destination</dt>
                <dd className="break-all text-foreground">{order.destinationAddress}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <dt className="uppercase tracking-wider">Amount</dt>
                  <dd className="text-foreground">{order.priceXrp} XRP</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider">Destination tag</dt>
                  <dd className="text-foreground">{order.destinationTag}</dd>
                </div>
              </div>
            </dl>
          </details>
        ) : null}
      </section>
    </div>
  )
}
