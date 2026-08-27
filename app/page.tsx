import { SiteHero } from '@/components/site-hero'
import { PackShop } from '@/components/pack-shop'

export default function Page() {
  return (
    <>
      <SiteHero />

      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <PackShop />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Rippleborn · Demo mode — packs are simulated and no XRPL transaction is broadcast.
          </p>
        </div>
      </footer>
    </>
  )
}
