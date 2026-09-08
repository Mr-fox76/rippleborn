'use client'

import { cn } from '@/lib/utils'
import { useCollectionOverlay } from '@/components/collection-overlay'

export function SiteNavigation() {
  const { open, toggleCollection } = useCollectionOverlay()

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
        Collections
      </button>
    </nav>
  )
}
