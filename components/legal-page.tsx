import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'

type LegalSection = {
  title: string
  paragraphs: string[]
}

type LegalPageProps = {
  title: string
  summary: string
  updated: string
  sections: LegalSection[]
}

export function LegalPage({ title, summary, updated, sections }: LegalPageProps) {
  return (
    <div className="table-surface min-h-svh">
      <header className="relative z-10 border-b border-border/40 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <Link href="/" aria-label="Ledgerborn home" className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="site-brand-mark" aria-hidden="true">
              <span className="site-brand-glyph">L</span>
            </span>
            <span className="hidden font-sans text-sm font-semibold tracking-[0.12em] text-foreground sm:inline">LEDGERBORN</span>
          </Link>
          <div className="flex items-center gap-3">
            <SiteNavigation />
            <p className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground sm:block">Legal</p>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 border-b border-border/40 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold">Ledgerborn</p>
          <h1 className="font-sans text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{summary}</p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Last updated: {updated}</p>
        </div>
        <div className="flex flex-col gap-9">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-sans text-xl font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground sm:text-base">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
