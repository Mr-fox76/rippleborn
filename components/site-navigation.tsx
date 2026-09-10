'use client'

import { Layers, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCollectionOverlay } from '@/components/collection-overlay'
import { useRecoveryOverlay } from '@/components/recovery-overlay'

export function SiteNavigation() {
  const { open, toggleCollection } = useCollectionOverlay()
  const { open: recoverOpen, toggleRecovery } = useRecoveryOverlay()

  return (
    <nav aria-label="Primary navigation" className="site-nav flex items-center gap-2">
      <button
        type="button"
        onClick={toggleCollection}
        aria-pressed={open}
        aria-expanded={open}
        className={cn('collection-nav-action', open && 'collection-nav-action-active')}
        aria-label={open ? 'Close Collections' : 'Open Collections'}
        title={open ? 'Close Collections' : 'Collections'}
      >
        <Layers className="nav-action-icon" aria-hidden="true" />
        <span className="nav-action-label">Collections</span>
      </button>
      <button
        type="button"
        onClick={toggleRecovery}
        aria-pressed={recoverOpen}
        aria-expanded={recoverOpen}
        className={cn('collection-nav-action', recoverOpen && 'collection-nav-action-active')}
        aria-label={recoverOpen ? 'Close Recover NFTs' : 'Open Recover NFTs'}
        title={recoverOpen ? 'Close Recover NFTs' : 'Recover NFTs'}
      >
        <RotateCcw className="nav-action-icon" aria-hidden="true" />
        <span className="nav-action-label">Recover</span>
      </button>
    </nav>
  )
}
