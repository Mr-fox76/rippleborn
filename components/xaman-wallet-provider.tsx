'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { isValidClassicAddress } from 'xrpl'

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
  dismissRequest: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)
const STORAGE_KEY = 'ledgerborn:xaman-account'

async function fetchStatus(url: string): Promise<WalletStatus> {
  const response = await fetch(url)
  const data = (await response.json()) as WalletStatus
  if (!response.ok) throw new Error(data.error ?? 'Unable to check wallet connection.')
  return data
}

export function XamanWalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [request, setRequest] = useState<WalletRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedAccount = window.localStorage.getItem(STORAGE_KEY)
    if (savedAccount && isValidClassicAddress(savedAccount)) {
      setAccount(savedAccount)
    } else if (savedAccount) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const { data: status, error: statusError } = useSWR(
    request && !account ? `/api/xaman/connect/${request.uuid}` : null,
    fetchStatus,
    {
      refreshInterval: (latest) => (latest?.status === 'pending' ? 6000 : 0),
      onSuccess: (latest) => {
        if (
          latest.status === 'connected' &&
          latest.account &&
          isValidClassicAddress(latest.account)
        ) {
          window.localStorage.setItem(STORAGE_KEY, latest.account)
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
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Unable to connect to Xaman.')
    } finally {
      setCreating(false)
    }
  }

  function disconnect() {
    window.localStorage.removeItem(STORAGE_KEY)
    setAccount(null)
    setRequest(null)
    setError(null)
  }

  function dismissRequest() {
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
      dismissRequest,
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
