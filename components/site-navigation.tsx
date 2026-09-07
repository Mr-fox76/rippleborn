'use client'

import { Images } from 'lucide-react'
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
        aria-label={open ? 'Close My Albums' : 'Open My Albums'}
        title={open ? 'Close My Albums' : 'My Albums'}
      >
        <Images className="collection-nav-icon" aria-hidden="true" />
      </button>
    </nav>
  )
}
