export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-[var(--color-surface-hover)] rounded-lg" />
          <div className="h-4 w-96 bg-[var(--color-surface-hover)]/70 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)] shrink-0" />
      </div>

      {/* KPI Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
          >
            <div className="h-3 w-28 bg-[var(--color-surface-hover)] rounded-md" />
            <div className="h-7 w-24 bg-[var(--color-surface-hover)] rounded-lg" />
            <div className="h-3 w-36 bg-[var(--color-surface-hover)]/60 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton: Full Width Chart */}
      <div className="p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-56 bg-[var(--color-surface-hover)] rounded-md" />
            <div className="h-3 w-80 bg-[var(--color-surface-hover)]/70 rounded-md" />
          </div>
          <div className="h-8 w-36 bg-[var(--color-surface-hover)] rounded-lg" />
        </div>
        <div className="h-72 bg-[var(--color-surface-hover)]/40 rounded-xl" />
      </div>
    </div>
  )
}
