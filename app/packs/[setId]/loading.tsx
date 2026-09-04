export default function Loading() {
  return (
    <div className="table-surface flex min-h-svh flex-col">
      <header className="sticky top-0 z-[100] border-b border-border/40 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-6 w-6 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-9 w-32 animate-pulse rounded bg-muted" />
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-sm border border-border/40 bg-muted" />
          ))}
        </div>
      </main>
    </div>
  )
}
