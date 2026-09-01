import { SiteHero } from '@/components/site-hero'

export default function SiteLayout({
  children,
  collection,
}: Readonly<{
  children: React.ReactNode
  collection: React.ReactNode
}>) {
  return (
    <div className="homepage-monochrome table-surface flex min-h-svh flex-col">
      <SiteHero />
      {children}
      {collection}
    </div>
  )
}
