export const NEWS_CONFIG = {
  /** Longest text an admin can publish. */
  bodyMaxLength: 2000,
  /** Most photos per post (fills the 2×2 grid). */
  maxImages: 4,
  /** Largest photo accepted by the server, after the browser has resized it. */
  maxImageBytes: 5 * 1024 * 1024,
  /** Formats accepted from the admin; every photo is re-encoded to WebP before storage. */
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Longest side of a stored photo, in pixels. */
  imageMaxDimension: 1920,
  /** WebP quality of stored photos (0–100). */
  imageQuality: 82,
  /** WebP quality used by the browser when it shrinks a photo before upload (0–1). */
  clientImageQuality: 0.88,
  /** Admin list pagination. */
  listPageSize: 10,
  listMaxPageSize: 50,
  /** Posts per page of the public news feed. */
  publicPageSize: 10,
  /** Lines of text shown on the home page teaser before "Voir plus". */
  teaserMaxLines: 6,
} as const;

export const ACCEPTED_IMAGE_LABEL = "JPG, PNG ou WEBP";
