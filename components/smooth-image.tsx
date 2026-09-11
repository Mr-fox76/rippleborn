'use client'

import Image, { type ImageProps } from 'next/image'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * next/image wrapper that fades the picture in once it decodes, so art never
 * pops in abruptly or flashes an empty frame. Images already in cache are
 * detected via the ref callback (`complete`) and shown instantly with no fade.
 */
export function SmoothImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)

  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true)
  }, [])

  return (
    <Image
      {...props}
      ref={ref}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      className={cn('transition-opacity duration-700 ease-out', loaded ? 'opacity-100' : 'opacity-0', className)}
    />
  )
}
