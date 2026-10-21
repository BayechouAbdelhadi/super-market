import type { ImageOutput, ProcessedImage } from "./types";

/**
 * Domain Port: turns an uploaded image into a web-ready one (oriented, resized, metadata stripped).
 */
export interface IImageProcessor {
  /** Throws when the bytes are not a decodable image. */
  process(bytes: Uint8Array, output: ImageOutput): Promise<ProcessedImage>;
}

/**
 * Domain Port: public file storage for images shown on the site or in emails.
 */
export interface IPublicImageStore {
  /** Stores the image at `path` (never overwrites) and returns its public URL. */
  upload(path: string, image: ProcessedImage): Promise<string>;
  remove(paths: string[]): Promise<void>;
}
