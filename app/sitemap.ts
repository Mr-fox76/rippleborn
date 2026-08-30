import type { MetadataRoute } from 'next'
import { PACK_CATALOG } from '@/lib/pack-catalog'

const baseUrl = 'https://ledgerborn.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const packPages: MetadataRoute.Sitemap = PACK_CATALOG.map((pack) => ({
    url: `${baseUrl}${pack.href}`,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...packPages,
    {
      url: `${baseUrl}/help`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
