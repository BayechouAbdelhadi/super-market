import { useState, useMemo, useCallback } from "react";

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

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page when items/pageSize changes (e.g. after a filter)
  const clampedPage = Math.min(page, totalPages);

  const setPage = useCallback(
    (p: number) => setPageRaw(Math.max(1, Math.min(p, totalPages))),
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const paginatedItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  return {
    paginatedItems,
    page: clampedPage,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
  };
}
