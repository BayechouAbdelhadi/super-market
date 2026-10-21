import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_CONFIG } from "../config";
import type { IPublicImageStore } from "../ports";
import type { ProcessedImage } from "../types";

/**
 * Infrastructure Adapter: images in the public Supabase Storage bucket.
 */
export class SupabasePublicImageStore implements IPublicImageStore {
  async upload(path: string, image: ProcessedImage): Promise<string> {
    const storage = createAdminClient().storage.from(MEDIA_CONFIG.bucket);
    const { error } = await storage.upload(path, image.bytes, {
      contentType: image.contentType,
      cacheControl: MEDIA_CONFIG.cacheControlSeconds,
      upsert: false,
    });
    if (error) throw new Error(`[SupabasePublicImageStore] upload failed: ${error.message}`);
    return storage.getPublicUrl(path).data.publicUrl;
  }

  async remove(paths: string[]): Promise<void> {
    const { error } = await createAdminClient().storage.from(MEDIA_CONFIG.bucket).remove(paths);
    if (error) throw new Error(`[SupabasePublicImageStore] remove failed: ${error.message}`);
  }
}
