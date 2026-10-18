interface HeaderReader {
  get(name: string): string | null;
}

/** Canonical public origin of the production site. */
export const PRODUCTION_APP_URL = "https://supermarket-calais.fr";

/**
 * Public origin used to build links sent by email (activation, password reset).
 *
 * SECURITY: the Host / X-Forwarded-* headers are attacker-controlled. Building
 * emailed links from them lets an attacker receive a victim's reset token
 * (host-header injection). Order:
 * 1. APP_URL / NEXT_PUBLIC_APP_URL when configured;
 * 2. in production, the canonical PRODUCTION_APP_URL — never the request headers;
 * 3. in development only, the request Host header (localhost / LAN testing).
 */
export function getAppOrigin(requestHeaders: HeaderReader): string {
  const configured = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)?.trim().replace(/\/+$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  const host = requestHeaders.get("host") || "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
