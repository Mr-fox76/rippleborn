'use client'

import { useEffect } from 'react'
import { SELECTED_SET_STORAGE_KEY } from '@/lib/pack-catalog'

/** Records the visited pack route as the last-selected set so `/` reopens on it. */
export function PersistLastSet({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(SELECTED_SET_STORAGE_KEY, slug)
    } catch {
      // Ignore storage access errors (private mode, disabled storage).
    }
  }, [slug])

  return null
}
