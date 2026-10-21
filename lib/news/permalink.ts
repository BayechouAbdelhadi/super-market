import type { NewsPost } from "./types";
import { formatNewsFullDate } from "./format";

/** Longest slug (words are never cut). */
const SLUG_MAX_LENGTH = 60;
/** Longest headline taken from the text (search results show about 60 characters). */
const HEADLINE_MAX_LENGTH = 70;
/** Longest meta description taken from the text. */
const DESCRIPTION_MAX_LENGTH = 155;

const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** Cuts at the last word boundary before `max`, adding "…" when something was cut. */
function truncateWords(text: string, max: number, ellipsis = "…"): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - ellipsis.length);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.!?-]+$/, "")}${ellipsis}`;
}

/** "Arrivage de dattes Medjool !" → "arrivage-de-dattes-medjool" */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return truncateWords(slug.replace(/-/g, " "), SLUG_MAX_LENGTH, "").replace(/ /g, "-");
}

/** The post's first line (its title, social media style), or its date for a photo-only post. */
export function newsPostHeadline(post: Pick<NewsPost, "body" | "createdAt">): string {
  const firstLine = post.body.split("\n").find((line) => line.trim())?.trim();
  return firstLine ? truncateWords(firstLine, HEADLINE_MAX_LENGTH) : `Actualité du ${formatNewsFullDate(post.createdAt).toLowerCase()}`;
}

/** Plain one-line summary for the meta description. */
export function newsPostDescription(post: Pick<NewsPost, "body" | "createdAt">): string {
  const text = post.body.replace(/\s+/g, " ").trim();
  return text ? truncateWords(text, DESCRIPTION_MAX_LENGTH) : newsPostHeadline(post);
}

/** Canonical path: "/actualites/<slug>-<uuid>". The slug is for readers; only the id identifies the post. */
export function newsPostPath(post: Pick<NewsPost, "id" | "body" | "createdAt">): string {
  const slug = slugify(post.body.split("\n").find((line) => line.trim()) ?? "") || "actualite";
  return `/actualites/${slug}-${post.id}`;
}

/** The post id at the end of a "<slug>-<uuid>" URL segment, or null. */
export function parseNewsPostParam(param: string): string | null {
  return param.match(UUID_AT_END)?.[1].toLowerCase() ?? null;
}
