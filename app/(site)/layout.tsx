import { SiteHero } from '@/components/site-hero'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="homepage-monochrome table-surface flex min-h-svh flex-col">
      <SiteHero />
      {children}
    </div>
  )
}
