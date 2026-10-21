import type { Metadata } from "next";

/** Name shown in search results, browser tabs and link previews. */
export const SITE_NAME = "Super Market Calais";

/** Title of the home page, and default title of pages that set none. */
export const DEFAULT_TITLE = "Super Market Calais — Supermarché de quartier ouvert 7j/7";

/** Default meta description (140–160 characters, with the local search terms). */
export const DEFAULT_DESCRIPTION =
  "Supermarché de quartier à Calais Saint-Exupéry, ouvert 7j/7 : volailles fraîches halal, produits turcs et marocains, primeur, surgelés et boissons en pack.";

/** Link preview image (1200×630 JPG, the storefront with its sign): Facebook, WhatsApp, X, LinkedIn. */
export const DEFAULT_SHARE_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Devanture de Super Market Calais, 205 avenue Antoine de Saint-Exupéry à Calais",
};

/**
 * Open Graph fields every public page shares (image included). Next replaces (does not merge) a parent's `openGraph`,
 * so pages spread this into their own.
 */
export const BASE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "fr_FR",
  type: "website",
  images: [DEFAULT_SHARE_IMAGE],
} as const satisfies Metadata["openGraph"];

/**
 * Pages that must never appear in search results (sign-in, account, unsubscribe…).
 * robots.txt alone does not keep a linked URL out of the index; this meta tag does.
 */
export const PRIVATE_PAGE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

/**
 * Ownership proofs for Google Search Console and Bing Webmaster Tools ("HTML tag" method), from the
 * environment so no code change is needed. Read at build time: rebuild after setting them.
 */
export function searchEngineVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  return {
    ...(google && { google }),
    ...(bing && { other: { "msvalidate.01": bing } }),
  };
}
