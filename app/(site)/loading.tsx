export default function Loading() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full max-w-2xl animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-sm border border-border/40 bg-muted" />
        ))}
      </div>
    </main>
  )
}
