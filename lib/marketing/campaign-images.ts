import { randomUUID } from "node:crypto";
import type { IImageProcessor, IPublicImageStore } from "@/lib/media/ports";
import { processUploadedImage, storagePath } from "@/lib/media/service";
import { SharpImageProcessor } from "@/lib/media/adapters/sharp-image-processor";
import { SupabasePublicImageStore } from "@/lib/media/adapters/supabase-public-image-store";
import { MARKETING_CONFIG } from "./config";

export interface CampaignImageDeps {
  images: IPublicImageStore;
  processor: IImageProcessor;
}

const defaultDeps: CampaignImageDeps = {
  images: new SupabasePublicImageStore(),
  processor: new SharpImageProcessor(),
};

export type UploadCampaignImageResult =
  | { ok: true; url: string; path: string; width: number; height: number }
  | { ok: false; reason: "INVALID_IMAGE" };

/**
 * Stores a campaign email banner: checks the real format, re-encodes it as an email-safe JPEG
 * (oriented, resized, metadata stripped), then uploads it under compaigns/<campaignId>/.
 * A draft without id yet gets a fresh folder.
 */
export async function uploadCampaignImage(
  bytes: Uint8Array,
  campaignId: string | undefined,
  deps: CampaignImageDeps = defaultDeps
): Promise<UploadCampaignImageResult> {
  const { storageFolder, ...output } = MARKETING_CONFIG.emailImage;
  const image = await processUploadedImage(bytes, output, deps.processor);
  if (!image) return { ok: false, reason: "INVALID_IMAGE" };

  const path = storagePath(`${storageFolder}/${campaignId ?? randomUUID()}`, `img-${Date.now()}`, image.extension);
  const url = await deps.images.upload(path, image);
  return { ok: true, url, path, width: image.width, height: image.height };
}
