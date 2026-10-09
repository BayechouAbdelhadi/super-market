export default function CashierLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-[var(--color-surface-hover)] rounded-lg" />
          <div className="h-4 w-96 bg-[var(--color-surface-hover)]/70 rounded-md" />
        </div>
        {/* Search Bar Skeleton */}
        <div className="flex gap-3 pt-2">
          <div className="h-12 flex-1 bg-[var(--color-surface-hover)] rounded-[var(--radius-input,12px)]" />
          <div className="h-12 w-36 bg-[var(--color-surface-hover)] rounded-[var(--radius-button,12px)] shrink-0" />
        </div>
      </div>

      {/* Suggested / Empty state placeholder */}
      <div className="p-12 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-[var(--color-surface-hover)]" />
        <div className="h-4 w-48 bg-[var(--color-surface-hover)] rounded-md" />
        <div className="h-3 w-64 bg-[var(--color-surface-hover)]/60 rounded-md" />
      </div>
    </div>
  )
}
