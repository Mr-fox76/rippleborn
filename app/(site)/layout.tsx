import { SiteHero } from '@/components/site-hero'

export default function SiteLayout({
  children,
  collection: _collection,
}: Readonly<{
  children: React.ReactNode
  collection: React.ReactNode
}>) {
  void _collection

  return (
    <div className="homepage-monochrome table-surface flex min-h-svh flex-col">
      <SiteHero />
      {children}
    </div>
  )
}
