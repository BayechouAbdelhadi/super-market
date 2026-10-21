interface HeaderReader {
  get(name: string): string | null;
}

/** Canonical public origin of the production site. */
export const PRODUCTION_APP_URL = "https://supermarketcalais.com";

/**
 * Other domains serving the site. They redirect permanently to PRODUCTION_APP_URL (next.config.ts),
 * so search engines index a single domain.
 */
export const REDIRECTED_HOSTS = ["www.supermarketcalais.com", "supermarketcalais.fr", "www.supermarketcalais.fr"] as const;

function configuredOrigin(value: string | undefined): string | undefined {
  return value?.trim().replace(/\/+$/, "") || undefined;
}

/**
 * Canonical public URL of the site, for anything that outlives the request: SEO metadata, sitemap,
 * structured data, QR codes, default links in emails. NEXT_PUBLIC_APP_URL when set (inlined in the browser
 * bundle), else the production domain. Safe in client components.
 */
export function getSiteUrl(): string {
  return configuredOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? PRODUCTION_APP_URL;
}

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
  const configured = configuredOrigin(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL);
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
