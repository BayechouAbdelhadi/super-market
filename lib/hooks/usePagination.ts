import { useState, useMemo, useCallback } from "react";
import { calculatePaginationMeta } from "@/lib/loyalty/pagination";

export interface UsePaginationOptions {
  /** Default page size. Default 10. */
  defaultPageSize?: number;
  /** Available page size options. */
  pageSizeOptions?: number[];
}

export interface UsePaginationResult<T> {
  /** Items for the current page only */
  paginatedItems: T[];
  /** Current page (1-indexed) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items in the source array */
  totalItems: number;
  /** Go to a specific page */
  setPage: (page: number) => void;
  /** Change page size and reset to page 1 */
  setPageSize: (size: number) => void;
}

/**
 * usePagination — client-side pagination for any array of items.
 *
 * Usage:
 *   const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } =
 *     usePagination(items, { defaultPageSize: 10 });
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { defaultPageSize = 10 } = options;

  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const meta = useMemo(
    () => calculatePaginationMeta(items.length, page, pageSize),
    [items.length, page, pageSize]
  );

  // Sync state if totalPages shrinks below current page
  if (page > meta.totalPages && meta.totalPages > 0) {
    setPageRaw(meta.totalPages);
  }

  const setPage = useCallback(
    (p: number) => setPageRaw(Math.max(1, Math.min(p, meta.totalPages))),
    [meta.totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const paginatedItems = useMemo(() => {
    return items.slice(meta.startIndex, meta.endIndex);
  }, [items, meta.startIndex, meta.endIndex]);

  return {
    paginatedItems,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
    totalItems: meta.totalItems,
    setPage,
    setPageSize,
  };
}
