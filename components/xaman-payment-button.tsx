'use client'

import Image from 'next/image'
import { Loader2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'

type PaymentRequest = { uuid: string; qrUrl: string; deepLink: string }
type PaymentStatus = {
  status: 'pending' | 'submitted' | 'failed' | 'rejected' | 'expired'
  transactionHash?: string
  error?: string
}

async function fetchStatus(url: string): Promise<PaymentStatus> {
  const response = await fetch(url)
  const data = (await response.json()) as PaymentStatus
  if (!response.ok) throw new Error(data.error ?? 'Unable to check payment status.')
  return data
}

export function XamanPaymentButton({
  buyer,
  orderId,
  onSubmitted,
}: {
  buyer: string
  orderId: number
  onSubmitted: (transactionHash?: string) => void
}) {
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: status, error: statusError } = useSWR(
    payment ? `/api/xaman/payment/${payment.uuid}` : null,
    fetchStatus,
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 2500 : 0),
      onSuccess: (latest) => {
        if (latest.status === 'submitted') onSubmitted(latest.transactionHash)
      },
    },
  )

  async function createPayment() {
    setCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/xaman/payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ buyer, orderId }),
      })
      const data = (await response.json()) as PaymentRequest & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Unable to create the Xaman payment.')
      setPayment(data)
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to create the payment.')
    } finally {
      setCreating(false)
    }
  }

  const terminalMessage =
    status?.status === 'rejected'
      ? 'Payment rejected in Xaman.'
      : status?.status === 'expired'
        ? 'Payment request expired. Create a new one.'
        : status?.status === 'failed'
          ? status.error ?? 'The payment failed.'
          : null
  const message = error ?? statusError?.message ?? terminalMessage

  if (status?.status === 'submitted') {
    return (
      <div className="rounded-md border border-gold/45 bg-gold/10 px-3 py-3 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">Payment submitted</p>
        <p className="mt-1 text-xs text-muted-foreground">Wait a few seconds, then reveal your cards.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-gold/35 bg-background/55 p-3 text-center">
      {!payment || terminalMessage ? (
        <Button
          type="button"
          onClick={createPayment}
          disabled={creating}
          className="w-full bg-gold text-primary-foreground hover:bg-gold/85"
        >
          {creating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Smartphone className="size-4" aria-hidden="true" />}
          {creating ? 'Preparing Xaman…' : 'Pay with Xaman'}
        </Button>
      ) : (
        <>
          <Image src={payment.qrUrl} alt="Scan to pay for this pack in Xaman" width={152} height={152} unoptimized />
          <a
            href={payment.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gold underline underline-offset-4"
          >
            Open in Xaman
          </a>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            Waiting for your signature
          </p>
        </>
      )}
      {message ? <p role="alert" className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}
