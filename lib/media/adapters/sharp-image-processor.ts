import sharp from "sharp";
import type { IImageProcessor } from "../ports";
import type { ImageOutput, ProcessedImage } from "../types";

/**
 * Infrastructure Adapter: re-encodes images with sharp. Applies the camera orientation, shrinks to
 * `maxDimension`, and writes a fresh file, which drops every metadata block (EXIF GPS position
 * included) and anything appended to the original file.
 */
export class SharpImageProcessor implements IImageProcessor {
  async process(bytes: Uint8Array, output: ImageOutput): Promise<ProcessedImage> {
    const pipeline = sharp(bytes)
      .rotate()
      .resize({ width: output.maxDimension, height: output.maxDimension, fit: "inside", withoutEnlargement: true });
    const encoded =
      output.format === "jpeg"
        ? // White behind transparent PNGs: JPEG has no alpha channel
          pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: output.quality, mozjpeg: true })
        : pipeline.webp({ quality: output.quality });
    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

    return {
      bytes: data,
      width: info.width,
      height: info.height,
      contentType: `image/${output.format}`,
      extension: output.format === "jpeg" ? "jpg" : "webp",
    };
  }
}
