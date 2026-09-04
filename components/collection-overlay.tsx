'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { preload } from 'swr'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WalletCollection, collectionSwrKey, fetchCollection } from '@/components/wallet-collection'
import { NftRecoveryPanel } from '@/components/nft-recovery-panel'
import { useXamanWallet } from '@/components/xaman-wallet-provider'

type CollectionOverlayValue = {
  open: boolean
  openCollection: () => void
  closeCollection: () => void
  toggleCollection: () => void
}

const CollectionOverlayContext = createContext<CollectionOverlayValue | null>(null)

const OVERLAY_QUERY_KEY = 'collection'

function syncOverlayQueryParam(next: boolean) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (next) url.searchParams.set(OVERLAY_QUERY_KEY, '1')
  else url.searchParams.delete(OVERLAY_QUERY_KEY)
  // Shallow update only — never triggers a Next.js navigation or remount.
  window.history.replaceState(window.history.state, '', url)
}

export function CollectionOverlayProvider({ children }: { children: ReactNode }) {
  const { account } = useXamanWallet()
  const [open, setOpen] = useState(false)

  const openCollection = useCallback(() => setOpen(true), [])
  const closeCollection = useCallback(() => setOpen(false), [])
  const toggleCollection = useCallback(() => setOpen((prev) => !prev), [])

  // Deep-link support: open the overlay when arriving with ?collection=1.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get(OVERLAY_QUERY_KEY) === '1') setOpen(true)
  }, [])

  // Keep the shallow query param in sync without navigating.
  useEffect(() => {
    syncOverlayQueryParam(open)
  }, [open])

  // Warm the wallet's NFTs the moment Xaman connects, cached by address for the
  // session, so opening the overlay is instant with no fetch wait.
  useEffect(() => {
    if (!account) return
    void preload(collectionSwrKey(account), fetchCollection)
  }, [account])

  const value = useMemo(
    () => ({ open, openCollection, closeCollection, toggleCollection }),
    [open, openCollection, closeCollection, toggleCollection],
  )

  return (
    <CollectionOverlayContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby="collection-overlay-description"
          className="collection-overlay-content top-20 right-4 bottom-4 left-4 flex w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl p-0 sm:top-24 sm:right-6 sm:bottom-6 sm:left-6 lg:right-[max(1.5rem,calc((100vw-80rem)/2))] lg:left-[max(1.5rem,calc((100vw-80rem)/2))]"
        >
          <DialogHeader className="collection-overlay-header shrink-0 gap-1 px-5 py-4 pr-14 sm:px-7 sm:py-5 sm:pr-16">
            <DialogTitle className="font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Your collection
            </DialogTitle>
            <DialogDescription id="collection-overlay-description" className="text-sm leading-relaxed text-muted-foreground">
              Browse your cards without leaving what you were doing.
            </DialogDescription>
          </DialogHeader>
          <div className="collection-overlay-scroll flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7">
            <WalletCollection compact />
            <NftRecoveryPanel />
          </div>
        </DialogContent>
      </Dialog>
    </CollectionOverlayContext.Provider>
  )
}

export function useCollectionOverlay() {
  const context = useContext(CollectionOverlayContext)
  if (!context) throw new Error('useCollectionOverlay must be used within CollectionOverlayProvider.')
  return context
}
