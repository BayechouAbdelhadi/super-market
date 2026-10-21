/** Image re-encoded for the web, ready for storage. */
export interface ProcessedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  contentType: string;
  extension: string;
}

/** How an image is re-encoded: format, longest side and quality (0–100). */
export interface ImageOutput {
  /** "jpeg" for emails (Outlook does not show WebP), "webp" for the site. */
  format: "webp" | "jpeg";
  maxDimension: number;
  quality: number;
}
