"use client";

import React from "react";
import { usePagination } from "@/lib/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

export interface PaginatedListProps<T> {
  /** Full array of items to paginate */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Unique key extractor */
  keyExtractor: (item: T) => string;
  /** Empty state node shown when items is empty */
  emptyState?: React.ReactNode;
  /** Default page size. Default 10. */
  defaultPageSize?: number;
  /** Available page size options. Default [10, 25, 50]. */
  pageSizeOptions?: number[];
  /** Show page size picker. Default true. */
  showPageSizePicker?: boolean;
  /** Class applied to the list container */
  listClassName?: string;
  /** Always show pagination even on single page. Default true. */
  alwaysShow?: boolean;
}

/**
 * PaginatedList — wraps any list with automatic, accessible pagination.
 *
 * Usage:
 *   <PaginatedList
 *     items={users}
 *     keyExtractor={(u) => u.id}
 *     renderItem={(u) => <UserRow user={u} />}
 *     defaultPageSize={10}
 *   />
 */
export function PaginatedList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyState,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  showPageSizePicker = true,
  listClassName = "space-y-3",
  alwaysShow = true,
}: PaginatedListProps<T>) {
  const {
    paginatedItems,
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination(items, { defaultPageSize });

  // Reset to page 1 when items array reference or query result changes
  const prevItemsRef = React.useRef(items);
  React.useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      setPage(1);
    }
  }, [items, setPage]);

  if (items.length === 0) {
    return (
      <>{emptyState ?? (
        <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-10 text-center text-sm text-[var(--color-text-muted)]">
          Aucun élément à afficher.
        </div>
      )}</>
    );
  }

  return (
    <div className="space-y-4">
      {/* List */}
      <div className={listClassName}>
        {paginatedItems.map((item, i) => (
          <React.Fragment key={keyExtractor(item)}>
            {renderItem(item, i)}
          </React.Fragment>
        ))}
      </div>

      {/* Pagination controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={showPageSizePicker ? setPageSize : undefined}
        pageSizeOptions={pageSizeOptions}
        alwaysShow={alwaysShow}
      />
    </div>
  );
}
