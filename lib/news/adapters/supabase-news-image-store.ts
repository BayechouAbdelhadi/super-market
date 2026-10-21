import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { INewsImageStore } from "../ports";
import type { NewsImage, ProcessedImage } from "../types";

/** Public bucket shared with the campaign images (see supabase/storage_rls.sql). */
const BUCKET = "super-market";
const FOLDER = "news";
/** Stored names never change (a new photo gets a new name), so browsers and CDNs may cache them for a year. */
const CACHE_CONTROL_SECONDS = "31536000";

/**
 * Infrastructure Adapter: news photos in Supabase Storage, under `news/<postId>/`.
 */
export class SupabaseNewsImageStore implements INewsImageStore {
  async upload(postId: string, index: number, image: ProcessedImage): Promise<NewsImage> {
    const path = `${FOLDER}/${postId}/${index + 1}-${randomBytes(6).toString("hex")}.${image.extension}`;
    const storage = createAdminClient().storage.from(BUCKET);

    const { error } = await storage.upload(path, image.bytes, {
      contentType: image.contentType,
      cacheControl: CACHE_CONTROL_SECONDS,
      upsert: false,
    });
    if (error) throw new Error(`[SupabaseNewsImageStore] upload failed: ${error.message}`);

    const { data } = storage.getPublicUrl(path);
    return { path, url: data.publicUrl, width: image.width, height: image.height };
  }

  async remove(paths: string[]): Promise<void> {
    const { error } = await createAdminClient().storage.from(BUCKET).remove(paths);
    if (error) throw new Error(`[SupabaseNewsImageStore] remove failed: ${error.message}`);
  }
}
