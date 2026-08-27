'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'

type WalletRequest = { uuid: string; qrUrl: string; deepLink: string }
type WalletStatus = {
  status: 'pending' | 'connected' | 'failed' | 'rejected' | 'expired'
  account?: string
  error?: string
}

type WalletContextValue = {
  account: string | null
  request: WalletRequest | null
  status: WalletStatus | null
  creating: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

async function fetchStatus(url: string): Promise<WalletStatus> {
  const response = await fetch(url)
  const data = (await response.json()) as WalletStatus
  if (!response.ok) throw new Error(data.error ?? 'Unable to check wallet connection.')
  return data
}

function openXaman(url: string) {
  if (window.self !== window.top) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function XamanWalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [request, setRequest] = useState<WalletRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: status, error: statusError } = useSWR(
    request && !account ? `/api/xaman/connect/${request.uuid}` : null,
    fetchStatus,
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 2500 : 0),
      onSuccess: (latest) => {
        if (latest.status === 'connected' && latest.account) {
          setAccount(latest.account)
          setRequest(null)
          setError(null)
        }
      },
    },
  )

  async function connect() {
    setCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/xaman/connect', { method: 'POST' })
      const data = (await response.json()) as WalletRequest & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Unable to create a Xaman connection.')
      setRequest(data)
      openXaman(data.deepLink)
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Unable to connect to Xaman.')
    } finally {
      setCreating(false)
    }
  }

  function disconnect() {
    setAccount(null)
    setRequest(null)
    setError(null)
  }

  const value = useMemo(
    () => ({
      account,
      request,
      status: status ?? null,
      creating,
      error: error ?? statusError?.message ?? null,
      connect,
      disconnect,
    }),
    [account, request, status, creating, error, statusError],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useXamanWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useXamanWallet must be used within XamanWalletProvider.')
  return context
}
