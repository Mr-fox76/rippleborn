'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
      >
        Collection
      </Link>
    </nav>
  )
}
