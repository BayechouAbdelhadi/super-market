import sharp from "sharp";
import { NEWS_CONFIG } from "../config";
import type { IImageProcessor } from "../ports";
import type { ProcessedImage } from "../types";

/**
 * Infrastructure Adapter: re-encodes photos with sharp. Applies the camera orientation, shrinks to
 * `imageMaxDimension`, and writes a fresh WebP, which drops every metadata block (EXIF GPS position
 * included) and anything appended to the original file.
 */
export class SharpImageProcessor implements IImageProcessor {
  async process(bytes: Uint8Array): Promise<ProcessedImage> {
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize({
        width: NEWS_CONFIG.imageMaxDimension,
        height: NEWS_CONFIG.imageMaxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: NEWS_CONFIG.imageQuality })
      .toBuffer({ resolveWithObject: true });

    return { bytes: data, width: info.width, height: info.height, contentType: "image/webp", extension: "webp" };
  }
}
