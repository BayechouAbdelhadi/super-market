import { randomUUID } from "node:crypto";
import type { IImageProcessor, INewsImageStore, INewsRepository } from "./ports";
import type {
  CreateNewsPostResult,
  InvalidImageError,
  NewsImage,
  NewsImageUpload,
  NewsPost,
  NewsPostPage,
  ProcessedImage,
  UpdateNewsPostResult,
} from "./types";
import { NEWS_CONFIG } from "./config";
import { detectImageType } from "./image-format";
import { SupabaseNewsRepository } from "./adapters/supabase-news-repository";
import { SupabaseNewsImageStore } from "./adapters/supabase-news-image-store";
import { SharpImageProcessor } from "./adapters/sharp-image-processor";

export interface NewsDeps {
  repo: INewsRepository;
  images: INewsImageStore;
  processor: IImageProcessor;
}

const defaultDeps: NewsDeps = {
  repo: new SupabaseNewsRepository(),
  images: new SupabaseNewsImageStore(),
  processor: new SharpImageProcessor(),
};

export function listNews(offset: number, limit: number, deps: Pick<NewsDeps, "repo"> = defaultDeps): Promise<NewsPostPage> {
  return deps.repo.list(offset, limit);
}

export function listPublishedNews(
  offset: number,
  limit: number,
  deps: Pick<NewsDeps, "repo"> = defaultDeps
): Promise<NewsPostPage> {
  return deps.repo.listPublished(offset, limit);
}

/**
 * Latest published post for the home page. Never throws: a storage failure
 * must not take the home page down, it only hides the news section.
 */
export async function getLatestNewsPost(deps: Pick<NewsDeps, "repo"> = defaultDeps): Promise<NewsPost | null> {
  try {
    const { items } = await deps.repo.listPublished(0, 1);
    return items[0] ?? null;
  } catch (err) {
    console.error("[News] Failed to load the latest post:", err);
    return null;
  }
}

/** Checks each photo's real format and re-encodes it for the web, before anything is stored. */
async function processUploads(
  uploads: NewsImageUpload[],
  processor: IImageProcessor
): Promise<{ ok: true; images: ProcessedImage[] } | InvalidImageError> {
  const images: ProcessedImage[] = [];
  for (const [index, upload] of uploads.entries()) {
    if (!detectImageType(upload.bytes)) return { ok: false, reason: "INVALID_IMAGE", index };
    try {
      images.push(await processor.process(upload.bytes));
    } catch (err) {
      console.warn(`[News] Image ${index} could not be decoded:`, err);
      return { ok: false, reason: "INVALID_IMAGE", index };
    }
  }
  return { ok: true, images };
}

/**
 * Stores the photos, then runs `save`. Photos stored by this call are removed again if storing or
 * saving fails, so a failed publish or edit leaves nothing behind.
 */
async function storeThenSave<T>(
  postId: string,
  firstIndex: number,
  images: ProcessedImage[],
  store: INewsImageStore,
  save: (stored: NewsImage[]) => Promise<T | null>
): Promise<T | null> {
  const stored: NewsImage[] = [];
  try {
    for (const [i, image] of images.entries()) {
      stored.push(await store.upload(postId, firstIndex + i, image));
    }
    const saved = await save(stored);
    if (saved === null) await removeImages(stored, store);
    return saved;
  } catch (err) {
    await removeImages(stored, store);
    throw err;
  }
}

/** Publishes a post with its text and photos. */
export async function createNewsPost(
  input: { body: string; images: NewsImageUpload[] },
  createdBy: string | null,
  deps: NewsDeps = defaultDeps
): Promise<CreateNewsPostResult> {
  const processed = await processUploads(input.images, deps.processor);
  if (!processed.ok) return processed;

  const id = randomUUID();
  const post = await storeThenSave(id, 0, processed.images, deps.images, (stored) =>
    deps.repo.create({ id, body: input.body, images: stored, createdBy })
  );
  // create() returns the post or throws
  return { ok: true, post: post as NewsPost };
}

/**
 * Edits a post: new text, the current photos to keep (by storage path, in their current order), then new photos.
 * Paths that are not photos of this post are ignored. The photos left out are deleted once the edit is saved.
 */
export async function updateNewsPost(
  id: string,
  input: { body: string; keepImagePaths: string[]; newImages: NewsImageUpload[] },
  deps: NewsDeps = defaultDeps
): Promise<UpdateNewsPostResult> {
  const current = await deps.repo.findById(id);
  if (!current) return { ok: false, reason: "NOT_FOUND" };

  const keep = new Set(input.keepImagePaths);
  const kept = current.images.filter((image) => keep.has(image.path));
  const dropped = current.images.filter((image) => !keep.has(image.path));
  const imageCount = kept.length + input.newImages.length;
  if (imageCount > NEWS_CONFIG.maxImages) return { ok: false, reason: "TOO_MANY_IMAGES" };
  if (!input.body && imageCount === 0) return { ok: false, reason: "EMPTY" };

  const processed = await processUploads(input.newImages, deps.processor);
  if (!processed.ok) return processed;

  const post = await storeThenSave(id, kept.length, processed.images, deps.images, (added) =>
    deps.repo.updateContent(id, { body: input.body, images: [...kept, ...added] })
  );
  // Deleted by someone else meanwhile
  if (!post) return { ok: false, reason: "NOT_FOUND" };

  await removeImages(dropped, deps.images);
  return { ok: true, post };
}

export function setNewsPostPublished(
  id: string,
  isPublished: boolean,
  deps: Pick<NewsDeps, "repo"> = defaultDeps
): Promise<NewsPost | null> {
  return deps.repo.setPublished(id, isPublished);
}

/** Deletes the post, then its photos. Returns false when the post does not exist. */
export async function deleteNewsPost(id: string, deps: Pick<NewsDeps, "repo" | "images"> = defaultDeps): Promise<boolean> {
  const deleted = await deps.repo.delete(id);
  if (!deleted) return false;
  await removeImages(deleted.images, deps.images);
  return true;
}

/** Best effort: the post is the source of truth, a leftover file is only wasted space. */
async function removeImages(images: NewsImage[], store: INewsImageStore): Promise<void> {
  if (images.length === 0) return;
  try {
    await store.remove(images.map((image) => image.path));
  } catch (err) {
    console.error("[News] Failed to remove images from storage:", err);
  }
}
