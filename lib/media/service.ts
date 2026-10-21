import { randomBytes } from "node:crypto";
import type { IImageProcessor } from "./ports";
import type { ImageOutput, ProcessedImage } from "./types";
import { detectImageType } from "./image-format";

/**
 * Checks the image's real format, then re-encodes it. Returns null for anything that is not a
 * decodable JPG, PNG or WebP, whatever its name or declared type.
 */
export async function processUploadedImage(
  bytes: Uint8Array,
  output: ImageOutput,
  processor: IImageProcessor
): Promise<ProcessedImage | null> {
  if (!detectImageType(bytes)) return null;
  try {
    return await processor.process(bytes, output);
  } catch (err) {
    console.warn("[Media] Image could not be decoded:", err);
    return null;
  }
}

/** "<folder>/<prefix>-<random>.<ext>": a new name for every upload, so nothing is ever overwritten. */
export function storagePath(folder: string, prefix: string, extension: string): string {
  return `${folder}/${prefix}-${randomBytes(6).toString("hex")}.${extension}`;
}
