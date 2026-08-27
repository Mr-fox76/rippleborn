import { PackShop } from '@/components/pack-shop'
import { SiteHero } from '@/components/site-hero'

export default function Page() {
  return (
    <div className="table-surface flex min-h-svh flex-col">
      <SiteHero />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-10">
        <PackShop />
      </main>
      <footer className="relative z-10 px-6 py-5 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          XRPL testnet · 3 cards · 5 XRP
        </p>
      </footer>
    </div>
  )
}
