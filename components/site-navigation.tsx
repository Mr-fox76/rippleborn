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
        href={isActive ? '/' : '/collection'}
        aria-current={isActive ? 'page' : undefined}
        aria-pressed={isActive}
        className={cn('collection-nav-action', isActive && 'collection-nav-action-active')}
        aria-label={isActive ? 'Close My Albums' : 'Open My Albums'}
        title={isActive ? 'Close My Albums' : 'My Albums'}
      >
        <span>My Albums</span>
      </Link>
    </nav>
  )
}
