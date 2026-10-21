/** Photo attached to a news post, stored in the public bucket. */
export interface NewsImage {
  /** Object path inside the bucket (used to delete it with the post). */
  path: string;
  url: string;
  width: number;
  height: number;
}

/** Store news shown on the public site, social media style: text and photos. */
export interface NewsPost {
  id: string;
  body: string;
  images: NewsImage[];
  /** Hidden posts stay in the admin list but are not shown on the site. */
  isPublished: boolean;
  createdAt: string;
  createdBy: string | null;
  /** Last change of the text or photos; null when never edited. */
  updatedAt: string | null;
}

export interface NewsPostContent {
  body: string;
  images: NewsImage[];
}

export interface NewNewsPost {
  id: string;
  body: string;
  images: NewsImage[];
  createdBy: string | null;
}

export interface NewsPostPage {
  items: NewsPost[];
  total: number;
}

/** Photo as received from the admin, before any check. */
export interface NewsImageUpload {
  bytes: Uint8Array;
}

/** Photo re-encoded for the web, ready for the bucket. */
export interface ProcessedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  contentType: string;
  extension: string;
}

/** `index` is the position of the rejected photo among the new uploads. */
export type InvalidImageError = { ok: false; reason: "INVALID_IMAGE"; index: number };

export type CreateNewsPostResult = { ok: true; post: NewsPost } | InvalidImageError;

export type UpdateNewsPostResult =
  | { ok: true; post: NewsPost }
  | InvalidImageError
  | { ok: false; reason: "NOT_FOUND" | "TOO_MANY_IMAGES" | "EMPTY" };
