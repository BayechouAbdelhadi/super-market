export default function LiveFeedLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-[var(--color-surface-hover)] rounded-lg" />
          <div className="h-4 w-96 bg-[var(--color-surface-hover)]/70 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)]" />
          <div className="h-9 w-32 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)]" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
          >
            <div className="h-3 w-24 bg-[var(--color-surface-hover)] rounded" />
            <div className="h-7 w-28 bg-[var(--color-surface-hover)] rounded-lg" />
            <div className="h-2.5 w-36 bg-[var(--color-surface-hover)]/60 rounded" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="h-20 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)]" />

      {/* Operations List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((j) => (
          <div
            key={j}
            className="p-4 rounded-[var(--radius-card,14px)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-[var(--color-surface-hover)] shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-44 bg-[var(--color-surface-hover)] rounded" />
                <div className="h-3 w-32 bg-[var(--color-surface-hover)]/70 rounded" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 w-20 bg-[var(--color-surface-hover)] rounded ml-auto" />
              <div className="h-3 w-28 bg-[var(--color-surface-hover)]/70 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
