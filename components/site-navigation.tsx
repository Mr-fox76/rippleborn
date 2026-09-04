'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SiteNavigation() {
  const pathname = usePathname()
  const isActive = pathname.startsWith('/collection')

  return (
    <nav aria-label="Primary navigation" className="site-nav flex items-center gap-2">
      <Link
        href={isActive ? '/' : '/collection'}
        aria-current={isActive ? 'page' : undefined}
        aria-pressed={isActive}
        className={cn('collection-nav-action', isActive && 'collection-nav-action-active')}
        aria-label={isActive ? 'Close My Albums' : 'Open My Albums'}
        title={isActive ? 'Close My Albums' : 'My Albums'}
      >
        <Images className="collection-nav-icon" aria-hidden="true" />
      </Link>
      <a
        href="https://t.me/LedgerBorn"
        target="_blank"
        rel="noopener noreferrer"
        className="collection-nav-action"
        aria-label="Join our Telegram group"
        title="Telegram"
      >
        <Send className="collection-nav-icon" aria-hidden="true" />
      </a>
    </nav>
  )
}
