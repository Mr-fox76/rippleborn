import { ChevronRight, Sparkles, Wallet, Package } from 'lucide-react'

const STEPS = [
  {
    icon: Wallet,
    title: 'Connect',
    description: 'Link your Xaman wallet to get started.',
  },
  {
    icon: Package,
    title: 'Open a pack',
    description: 'Pay 5 XRP and open a pack of 3 cards.',
  },
  {
    icon: Sparkles,
    title: 'Reveal & keep',
    description: 'Cards mint straight to your wallet on the XRP Ledger.',
  },
] as const

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <h2
        id="how-it-works-heading"
        className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
      >
        How it works
      </h2>
      <ol className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.title} className="contents">
              <div className="flex flex-1 flex-col items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-5 py-6 text-center">
                <span className="flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground/50 sm:rotate-0"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
