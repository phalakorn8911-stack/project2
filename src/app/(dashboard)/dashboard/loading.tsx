export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted/60" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="size-5 rounded bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted/60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted/60" />
            <div className="h-48 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
