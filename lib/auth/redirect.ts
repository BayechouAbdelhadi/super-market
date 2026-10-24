/** Query parameter carrying the page to come back to after logging in or signing up. */
export const NEXT_PARAM = "next";

/**
 * Returns `value` when it is a same-origin path ("/x"), else null.
 * SECURITY: rejects "//evil.tld", "/\evil.tld" and absolute URLs (open redirect).
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** `path` with the `next` parameter when there is a safe one. */
export function withNextParam(path: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  return safe ? `${path}?${NEXT_PARAM}=${encodeURIComponent(safe)}` : path;
}
