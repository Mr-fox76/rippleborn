import { CARDS_PER_PACK, PACK_PRICE_XRP } from '@/lib/rippleborn'
import { ConnectWalletButton } from '@/components/connect-wallet-button'

export function SiteHero() {
  return (
    <header className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-6">
        <nav className="flex items-center justify-between gap-4">
          <span className="font-mono text-sm uppercase tracking-[0.28em] text-primary">
            Rippleborn
          </span>
          <ConnectWalletButton />
        </nav>

        <div className="flex flex-col gap-6 py-8 sm:py-16">
          <h1 className="font-sans text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-7xl">
            Rippleborn
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Open the ledger. Pull the myth.
          </p>

          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2">
            <div className="flex flex-col gap-1">
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Per pack
              </dt>
              <dd className="font-sans text-base text-foreground">
                {CARDS_PER_PACK} XRPL NFTs
              </dd>
            </div>

            <div aria-hidden="true" className="h-8 w-px bg-border" />

            <div className="flex flex-col gap-1">
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Price
              </dt>
              <dd className="font-sans text-base text-gold">{PACK_PRICE_XRP} XRP</dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  )
}
