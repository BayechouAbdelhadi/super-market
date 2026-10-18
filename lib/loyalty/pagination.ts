/**
 * Centralized pagination calculation and slicing utility.
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Calculates pagination metadata and clamps page bounds safely.
 */
export function calculatePaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / safePageSize));
  const clampedPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (clampedPage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, Math.max(0, totalItems));

  return {
    page: clampedPage,
    pageSize: safePageSize,
    totalItems: Math.max(0, totalItems),
    totalPages,
    hasNextPage: clampedPage < totalPages,
    hasPrevPage: clampedPage > 1,
    startIndex,
    endIndex,
  };
}

/**
 * Slices any array of items according to pagination parameters.
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const meta = calculatePaginationMeta(items.length, page, pageSize);
  const slicedItems = items.slice(meta.startIndex, meta.endIndex);

  return {
    items: slicedItems,
    meta,
  };
}

export interface PageParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parses `page` / `limit` query parameters (1-based page, limit clamped to `maxLimit`).
 * Returns null when neither parameter is present (caller keeps its unpaginated response).
 */
export function parsePageParams(
  searchParams: URLSearchParams,
  defaultLimit: number,
  maxLimit: number
): PageParams | null {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  if (!pageParam && !limitParam) {
    return null;
  }

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitParam || `${defaultLimit}`, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}
