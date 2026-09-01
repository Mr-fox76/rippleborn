'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SiteNavigation() {
  const pathname = usePathname()
  const isActive = pathname.startsWith('/collection')

  return (
    <nav aria-label="Primary navigation" className="site-nav flex items-center">
      <Link
        href="/collection"
        aria-current={isActive ? 'page' : undefined}
        className={cn('collection-nav-action', isActive && 'collection-nav-action-active')}
        aria-label="Open collection"
        title="Collection"
      >
        <Images className="size-4" aria-hidden="true" />
        <span className="sr-only">Collection</span>
      </Link>
    </nav>
  )
}
