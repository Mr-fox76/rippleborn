'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WalletCollection } from '@/components/wallet-collection'
import { NftRecoveryPanel } from '@/components/nft-recovery-panel'

export function CollectionOverlay() {
  const router = useRouter()

  function closeOverlay() {
    router.back()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) closeOverlay() }}>
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
  )
}
