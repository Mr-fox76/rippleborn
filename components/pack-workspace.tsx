'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PackShop } from '@/components/pack-shop'
import {
  PACK_CATALOG,
  SELECTED_SET_STORAGE_KEY,
  getPackBySlug,
  type PackCatalogEntry,
} from '@/lib/pack-catalog'
import type { CollectionStats } from '@/lib/pack-results'
import type { PackSetId } from '@/lib/rippleborn'
import { cn } from '@/lib/utils'

/** Accent colour per set tab, echoing each theme's strong accent. */
const TAB_ACCENTS: Record<PackCatalogEntry['theme']['id'], string> = {
  mythic: 'oklch(0.84 0.19 325)',
  cyborg: 'oklch(0.82 0.17 62)',
  chromatic: 'oklch(0.73 0.2 335)',
  slack: 'oklch(0.76 0.18 48)',
}

export function PackWorkspace({
  statsBySet,
  initialSlug,
}: {
  statsBySet: Record<PackSetId, CollectionStats>
  initialSlug?: string
}) {
  const initialPack = getPackBySlug(initialSlug ?? '') ?? PACK_CATALOG[0]
  const [selectedId, setSelectedId] = useState<PackSetId>(initialPack.id)
  const hadValidInitial = useRef(Boolean(getPackBySlug(initialSlug ?? '')))
  const busyRef = useRef(false)

  // Restore the last-selected set from localStorage only when the URL did not pin one.
  useEffect(() => {
    if (hadValidInitial.current) return
    try {
      const stored = window.localStorage.getItem(SELECTED_SET_STORAGE_KEY)
      const storedPack = stored ? getPackBySlug(stored) : undefined
      if (storedPack) setSelectedId(storedPack.id)
    } catch {
      // Ignore storage access errors (private mode, disabled storage).
    }
  }, [])

  const selectedPack = PACK_CATALOG.find((pack) => pack.id === selectedId) ?? PACK_CATALOG[0]
  const selectedSlug = selectedPack.theme.id

  // Persist the choice and reflect it in the URL so links can open a specific set.
  useEffect(() => {
    try {
      window.localStorage.setItem(SELECTED_SET_STORAGE_KEY, selectedSlug)
    } catch {
      // Ignore storage access errors.
    }
    const url = new URL(window.location.href)
    url.searchParams.set('set', selectedSlug)
    window.history.replaceState(null, '', url)
  }, [selectedSlug])

  const handleSelect = useCallback(
    (pack: PackCatalogEntry) => {
      if (pack.id === selectedId) return
      if (busyRef.current) {
        const proceed = window.confirm(
          'A pack is being prepared, paid, or revealed. Switch sets and discard it?',
        )
        if (!proceed) return
      }
      setSelectedId(pack.id)
    },
    [selectedId],
  )

  const handleActivity = useCallback((busy: boolean) => {
    busyRef.current = busy
  }, [])

  return (
    <section aria-label="Open a pack" className="flex w-full flex-col gap-2">
      <div
        role="tablist"
        aria-label="Choose a set"
        className="sticky top-3 z-40 flex w-full items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur-md"
      >
        {PACK_CATALOG.map((pack) => {
          const active = pack.id === selectedId
          const accent = TAB_ACCENTS[pack.theme.id]
          return (
            <button
              key={pack.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelect(pack)}
              style={
                active
                  ? {
                      color: accent,
                      borderColor: `color-mix(in oklch, ${accent} 55%, transparent)`,
                      boxShadow: `0 0 1.25rem color-mix(in oklch, ${accent} 22%, transparent)`,
                    }
                  : undefined
              }
              className={cn(
                'flex-1 rounded-full border px-2 py-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] transition-colors sm:px-3 sm:text-xs sm:tracking-[0.14em]',
                active
                  ? 'bg-background/60'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {pack.kicker.split(' ').at(-1)}
            </button>
          )
        })}
      </div>

      <div
        key={selectedPack.id}
        className={cn(
          'pack-theme relative isolate overflow-hidden rounded-2xl border border-border/50 px-2 py-6 sm:px-4 sm:py-8',
          `pack-theme-${selectedSlug}`,
        )}
      >
        <PackShop
          pack={selectedPack}
          collectionStats={statsBySet[selectedPack.id]}
          onActivityChange={handleActivity}
        />
      </div>
    </section>
  )
}
