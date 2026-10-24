/** Strips PostgREST filter syntax from a search term used inside an `.or()` filter. */
export function normalizeSearchTerm(query: string): string {
  // SECURITY: strip PostgREST filter syntax (",", "(", ")", quotes, backslash) so the
  // search term cannot add or break conditions inside the `.or()` filter.
  return query.replace(/[,()"\\]/g, " ").trim().toLowerCase();
}
