import type { Metadata } from "next";

/** Name shown in search results, browser tabs and link previews. */
export const SITE_NAME = "Super Market Calais";

/** Title of the home page, and default title of pages that set none. */
export const DEFAULT_TITLE = "Super Market Calais — Supermarché de quartier ouvert 7j/7";

/** Default meta description (140–160 characters, with the local search terms). */
export const DEFAULT_DESCRIPTION =
  "Supermarché de quartier à Calais Saint-Exupéry, ouvert 7j/7 : volailles fraîches halal, produits turcs et marocains, primeur, surgelés et boissons en pack.";

/**
 * Open Graph fields every public page shares. Next replaces (does not merge) a parent's `openGraph`,
 * so pages spread this into their own.
 */
export const BASE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "fr_FR",
  type: "website",
} as const satisfies Metadata["openGraph"];

/**
 * Pages that must never appear in search results (sign-in, account, unsubscribe…).
 * robots.txt alone does not keep a linked URL out of the index; this meta tag does.
 */
export const PRIVATE_PAGE_ROBOTS: Metadata["robots"] = { index: false, follow: false };
