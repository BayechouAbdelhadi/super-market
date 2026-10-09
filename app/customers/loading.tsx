export default function CustomersLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-[var(--color-surface-hover)] rounded-lg" />
          <div className="h-4 w-80 bg-[var(--color-surface-hover)]/70 rounded-md" />
        </div>
        <div className="h-11 w-40 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)] shrink-0" />
      </div>

      {/* Search Input Skeleton */}
      <div className="h-12 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input,12px)]" />

      {/* Table / List Items Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-full bg-[var(--color-surface-hover)] shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-[var(--color-surface-hover)] rounded-md" />
                <div className="h-3 w-56 bg-[var(--color-surface-hover)]/70 rounded-md" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-6 w-20 bg-[var(--color-surface-hover)] rounded-full" />
              <div className="h-9 w-28 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
