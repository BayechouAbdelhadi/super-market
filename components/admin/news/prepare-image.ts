import { NEWS_CONFIG } from "@/lib/news/config";

/** A photo picked by the admin, shrunk in the browser and ready to upload. */
export interface PreparedImage {
  key: string;
  file: File;
  /** blob: URL for the preview; revoke it when the photo is removed. */
  previewUrl: string;
  width: number;
  height: number;
}

let nextKey = 0;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Applies the camera orientation and shrinks the photo to the stored size before upload, so phone
 * photos (often 4–8 MB) upload quickly and stay under the server limits. The server re-encodes it anyway.
 * Throws when the browser cannot read the file as an image.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, NEWS_CONFIG.imageMaxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D indisponible");
    context.drawImage(bitmap, 0, 0, width, height);

    // Browsers without a WebP encoder return a PNG: fall back to JPEG, much lighter for photos
    let blob = await toBlob(canvas, "image/webp", NEWS_CONFIG.clientImageQuality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", NEWS_CONFIG.clientImageQuality);
    if (!blob) throw new Error("Encodage de l'image impossible");

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const name = `${file.name.replace(/\.[^.]*$/, "") || "photo"}.${extension}`;
    // Keep the original when it is already small and shrinking did not help
    const upload = scale === 1 && file.size <= blob.size ? file : new File([blob], name, { type: blob.type });

    return { key: `img-${nextKey++}`, file: upload, previewUrl: URL.createObjectURL(upload), width, height };
  } finally {
    bitmap.close();
  }
}
