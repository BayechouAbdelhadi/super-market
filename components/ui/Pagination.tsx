"use client";

import React from "react";

export interface PaginationProps {
  /** Current active page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items (for display) */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Called when the user selects a new page */
  onPageChange: (page: number) => void;
  /** Called when the user changes page size. Omit to hide the selector. */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options. Defaults to [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Show total items count. Default true. */
  showTotal?: boolean;
  /** Always show pagination even on single page. Default false. */
  alwaysShow?: boolean;
}

/** Maximum page buttons rendered before collapsing to ellipsis */
const MAX_VISIBLE_PAGES = 5;

function buildPageRange(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [];
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);

  let start = Math.max(2, page - half);
  let end = Math.min(totalPages - 1, page + half);

  // Shift window so it always shows MAX_VISIBLE_PAGES - 2 middle pages
  if (page - half < 2) end = Math.min(totalPages - 1, MAX_VISIBLE_PAGES - 1);
  if (page + half > totalPages - 1) start = Math.max(2, totalPages - MAX_VISIBLE_PAGES + 2);

  pages.push(1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);

  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showTotal = true,
  alwaysShow = false,
}: PaginationProps) {
  if (!alwaysShow && totalPages <= 1 && totalItems <= Math.min(...pageSizeOptions)) return null;

  const from = Math.min((page - 1) * pageSize + 1, totalItems);
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPageRange(page, totalPages);

  const btnBase =
    "inline-flex items-center justify-center h-9 min-w-[36px] px-2 rounded-[var(--radius-button,12px)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] select-none";
  const btnActive = `${btnBase} bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-sm`;
  const btnDefault = `${btnBase} bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]`;
  const btnDisabled = `${btnBase} opacity-30 cursor-not-allowed`;

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]"
      role="navigation"
      aria-label="Pagination"
    >
      {/* Left — total + page size */}
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        {showTotal && totalItems > 0 && (
          <span>
            <span className="font-semibold text-[var(--color-text)]">{from}–{to}</span>
            {" "}sur{" "}
            <span className="font-semibold text-[var(--color-text)]">{totalItems}</span>
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-8 rounded-[var(--radius-button,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-xs px-2 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              aria-label="Éléments par page"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>/ page</span>
          </div>
        )}
      </div>

      {/* Right — page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={page <= 1 ? btnDisabled : btnDefault}
            aria-label="Page précédente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[var(--color-text-muted)] text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={p === page ? btnActive : btnDefault}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={page >= totalPages ? btnDisabled : btnDefault}
            aria-label="Page suivante"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
