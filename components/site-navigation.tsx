'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home' },
  { href: '/collection', label: 'Collection' },
]

export function SiteNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation" className="site-nav flex items-center gap-1">
      {items.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn('site-nav-link', isActive && 'site-nav-link-active')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
