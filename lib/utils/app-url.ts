interface HeaderReader {
  get(name: string): string | null;
}

let warnedMissingAppUrl = false;

/**
 * Public origin used to build links sent by email (activation, password reset).
 *
 * SECURITY: the Host / X-Forwarded-* headers are attacker-controlled. Building
 * emailed links from them lets an attacker receive a victim's reset token
 * (host-header injection). Set NEXT_PUBLIC_APP_URL (e.g. https://supermarket-calais.fr)
 * in every deployed environment; the header-derived origin is only a fallback
 * for local development.
 */
export function getAppOrigin(requestHeaders: HeaderReader): string {
  const configured = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)?.trim().replace(/\/+$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production" && !warnedMissingAppUrl) {
    warnedMissingAppUrl = true;
    console.warn("[getAppOrigin] NEXT_PUBLIC_APP_URL is not set: email links fall back to the request Host header.");
  }

  const host = requestHeaders.get("host") || "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
