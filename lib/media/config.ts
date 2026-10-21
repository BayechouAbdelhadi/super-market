export const MEDIA_CONFIG = {
  /** Formats accepted from admins; every image is re-encoded before storage. */
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Largest upload accepted by the server. */
  maxImageBytes: 5 * 1024 * 1024,
  /** Public Supabase Storage bucket for site and email images (see supabase/storage_rls.sql). */
  bucket: "super-market",
  /** Stored names never change (a new image gets a new name), so browsers and CDNs may cache for a year. */
  cacheControlSeconds: "31536000",
} as const;

export const ACCEPTED_IMAGE_LABEL = "JPG, PNG ou WEBP";

export type AcceptedImageType = (typeof MEDIA_CONFIG.acceptedImageTypes)[number];
