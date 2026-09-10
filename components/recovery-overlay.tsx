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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NftRecoveryPanel } from '@/components/nft-recovery-panel'

type RecoveryOverlayValue = {
  open: boolean
  openRecovery: () => void
  closeRecovery: () => void
  toggleRecovery: () => void
}

const RecoveryOverlayContext = createContext<RecoveryOverlayValue | null>(null)

const OVERLAY_QUERY_KEY = 'recover'

function syncOverlayQueryParam(next: boolean) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (next) url.searchParams.set(OVERLAY_QUERY_KEY, '1')
  else url.searchParams.delete(OVERLAY_QUERY_KEY)
  // Shallow update only — never triggers a Next.js navigation or remount.
  window.history.replaceState(window.history.state, '', url)
}

export function RecoveryOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openRecovery = useCallback(() => setOpen(true), [])
  const closeRecovery = useCallback(() => setOpen(false), [])
  const toggleRecovery = useCallback(() => setOpen((prev) => !prev), [])

  // Deep-link support: open the overlay when arriving with ?recover=1.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get(OVERLAY_QUERY_KEY) === '1') setOpen(true)
  }, [])

  // Keep the shallow query param in sync without navigating.
  useEffect(() => {
    syncOverlayQueryParam(open)
  }, [open])

  const value = useMemo(
    () => ({ open, openRecovery, closeRecovery, toggleRecovery }),
    [open, openRecovery, closeRecovery, toggleRecovery],
  )

  return (
    <RecoveryOverlayContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby="recovery-overlay-description"
          className="collection-overlay-content top-20 right-4 bottom-4 left-4 flex w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl p-0 sm:top-24 sm:right-6 sm:bottom-6 sm:left-6 lg:right-[max(1.5rem,calc((100vw-64rem)/2))] lg:left-[max(1.5rem,calc((100vw-64rem)/2))]"
        >
          <DialogHeader className="collection-overlay-header shrink-0 gap-1 px-5 py-4 pr-14 sm:px-7 sm:py-5 sm:pr-16">
            <DialogTitle className="font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Recover NFTs
            </DialogTitle>
            <DialogDescription id="recovery-overlay-description" className="text-sm leading-relaxed text-muted-foreground">
              Claim open NFT offers you missed after opening a pack, or recover earlier NFTs with invalid explorer metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="collection-overlay-scroll flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7">
            <NftRecoveryPanel />
          </div>
        </DialogContent>
      </Dialog>
    </RecoveryOverlayContext.Provider>
  )
}

export function useRecoveryOverlay() {
  const context = useContext(RecoveryOverlayContext)
  if (!context) throw new Error('useRecoveryOverlay must be used within RecoveryOverlayProvider.')
  return context
}
