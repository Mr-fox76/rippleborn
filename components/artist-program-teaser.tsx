const STAGES = [
  {
    label: 'Your artwork',
    description: 'Artists bring the vision and finished artwork for an original collection.',
    artwork: '/sets/chromatic-abyss/images/dream-architect.png',
  },
  {
    label: 'We build the set',
    description: 'Ledgerborn handles the set creation and the groundwork behind the release.',
    artwork: '/sets/cyborg-cowboy/images/cobalt-gunsmith.png',
  },
  {
    label: 'Earn royalties',
    description: 'Artists receive a royalty when their collection changes hands.',
    artwork: '/sets/chromatic-abyss/images/thousand-petaled-mind.png',
    backgroundSize: '116% auto',
  },
] as const

export function ArtistProgramTeaser() {
  return (
    <section aria-labelledby="artist-program-heading" className="mx-auto w-full max-w-6xl border-y border-border/60 py-10 sm:py-14">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-foreground" aria-hidden="true" />
            Artist programme · Coming soon
          </p>
          <h2 id="artist-program-heading" className="font-sans text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl lg:text-5xl">
            Your artwork. <span className="text-muted-foreground">A collection made real.</span>
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            We&apos;re exploring a new way for artists to launch original NFT card sets. You create the artwork; Ledgerborn takes care of building the collection and its foundations, while you earn royalties from future transactions.
          </p>
        </div>

        <p aria-disabled="true" className="w-fit border border-border/70 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Applications are not open yet
        </p>
      </div>

      <ol className="mt-10 grid list-none grid-cols-1 gap-px overflow-hidden border border-border/60 bg-border/60 sm:grid-cols-3">
        {STAGES.map(({ label, description, artwork, ...stage }, index) => (
          <li
            key={label}
            className="relative isolate flex min-h-72 items-center justify-center overflow-hidden bg-background p-6 text-center sm:p-7"
            style={{ backgroundImage: `url('${artwork}')`, backgroundPosition: 'center', backgroundSize: 'backgroundSize' in stage ? stage.backgroundSize : 'cover' }}
          >
            <span className="absolute inset-0 -z-10 bg-background/75" aria-hidden="true" />
            <div className="flex max-w-sm flex-col items-center gap-5">
              <span className="font-mono text-[0.6rem] tracking-[0.22em] text-muted-foreground" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="whitespace-nowrap font-sans text-2xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-3xl">
                {label}
              </h3>
              <span className="h-px w-12 bg-foreground" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-foreground/80">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
