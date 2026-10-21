import { randomUUID } from "node:crypto";
import type { IImageProcessor, IPublicImageStore } from "@/lib/media/ports";
import type { ImageOutput, ProcessedImage } from "@/lib/media/types";
import { processUploadedImage, storagePath } from "@/lib/media/service";
import { SharpImageProcessor } from "@/lib/media/adapters/sharp-image-processor";
import { SupabasePublicImageStore } from "@/lib/media/adapters/supabase-public-image-store";
import type { INewsRepository } from "./ports";
import type {
  CreateNewsPostResult,
  InvalidImageError,
  NewsImage,
  NewsImageUpload,
  NewsPhotoLayoutItem,
  NewsPost,
  NewsPostPage,
  UpdateNewsPostResult,
} from "./types";
import { NEWS_CONFIG } from "./config";
import { SupabaseNewsRepository } from "./adapters/supabase-news-repository";

export interface NewsDeps {
  repo: INewsRepository;
  images: IPublicImageStore;
  processor: IImageProcessor;
}

const defaultDeps: NewsDeps = {
  repo: new SupabaseNewsRepository(),
  images: new SupabasePublicImageStore(),
  processor: new SharpImageProcessor(),
};

/** News photos: WebP for the site, at most NEWS_CONFIG.imageMaxDimension pixels. */
const NEWS_IMAGE_OUTPUT: ImageOutput = {
  format: "webp",
  maxDimension: NEWS_CONFIG.imageMaxDimension,
  quality: NEWS_CONFIG.imageQuality,
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

/** A post for its public page: null when it does not exist or is hidden. */
export async function getPublishedNewsPost(
  id: string,
  deps: Pick<NewsDeps, "repo"> = defaultDeps
): Promise<NewsPost | null> {
  const post = await deps.repo.findById(id);
  return post?.isPublished ? post : null;
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
    const image = await processUploadedImage(upload.bytes, NEWS_IMAGE_OUTPUT, processor);
    if (!image) return { ok: false, reason: "INVALID_IMAGE", index };
    images.push(image);
  }
  return { ok: true, images };
}

/** A processed photo waiting for storage, with its place in the post. */
interface PhotoToStore {
  image: ProcessedImage;
  alt: string;
  /** 0-based position in the post (also numbers the stored file). */
  position: number;
}

function withAlt(image: Omit<NewsImage, "alt">, alt: string): NewsImage {
  return alt ? { ...image, alt } : image;
}

/**
 * Stores the photos, then runs `save` with them by position. Photos stored by this call are removed again
 * if storing or saving fails, so a failed publish or edit leaves nothing behind.
 */
async function storeThenSave<T>(
  postId: string,
  photos: PhotoToStore[],
  store: IPublicImageStore,
  save: (stored: Map<number, NewsImage>) => Promise<T | null>
): Promise<T | null> {
  const stored = new Map<number, NewsImage>();
  try {
    for (const { image, alt, position } of photos) {
      // news/<postId>/<position>-<random>.webp
      const path = storagePath(`${NEWS_CONFIG.storageFolder}/${postId}`, String(position + 1), image.extension);
      const url = await store.upload(path, image);
      stored.set(position, withAlt({ path, url, width: image.width, height: image.height }, alt));
    }
    const saved = await save(stored);
    if (saved === null) await removeImages([...stored.values()], store);
    return saved;
  } catch (err) {
    await removeImages([...stored.values()], store);
    throw err;
  }
}

/** Publishes a post with its text and photos (in display order, each with its description). */
export async function createNewsPost(
  input: { body: string; images: NewsImageUpload[] },
  createdBy: string | null,
  deps: NewsDeps = defaultDeps
): Promise<CreateNewsPostResult> {
  const processed = await processUploads(input.images, deps.processor);
  if (!processed.ok) return processed;

  const id = randomUUID();
  const photos = processed.images.map((image, position) => ({ image, alt: input.images[position].alt, position }));
  const post = await storeThenSave(id, photos, deps.images, (stored) =>
    deps.repo.create({ id, body: input.body, images: photos.map(({ position }) => stored.get(position)!), createdBy })
  );
  // create() returns the post or throws
  return { ok: true, post: post as NewsPost };
}

/**
 * Edits a post: new text and its photos in display order, each either kept (by storage path, with a possibly new
 * description) or newly uploaded. Paths that are not photos of this post, and repeated paths, are ignored.
 * The photos left out are deleted once the edit is saved.
 */
export async function updateNewsPost(
  id: string,
  input: { body: string; photos: NewsPhotoLayoutItem[] },
  deps: NewsDeps = defaultDeps
): Promise<UpdateNewsPostResult> {
  const current = await deps.repo.findById(id);
  if (!current) return { ok: false, reason: "NOT_FOUND" };

  const byPath = new Map(current.images.map((image) => [image.path, image]));
  const seen = new Set<string>();
  const photos = input.photos.filter((photo) => {
    if (photo.kind === "new") return true;
    if (!byPath.has(photo.path) || seen.has(photo.path)) return false;
    seen.add(photo.path);
    return true;
  });
  if (photos.length > NEWS_CONFIG.maxImages) return { ok: false, reason: "TOO_MANY_IMAGES" };
  if (!input.body && photos.length === 0) return { ok: false, reason: "EMPTY" };

  const uploads = photos.flatMap((photo) => (photo.kind === "new" ? [photo.upload] : []));
  const processed = await processUploads(uploads, deps.processor);
  if (!processed.ok) return processed;

  let next = 0;
  const toStore: PhotoToStore[] = photos.flatMap((photo, position) =>
    photo.kind === "new" ? [{ image: processed.images[next++], alt: photo.upload.alt, position }] : []
  );
  const dropped = current.images.filter((image) => !seen.has(image.path));

  const post = await storeThenSave(id, toStore, deps.images, (stored) =>
    deps.repo.updateContent(id, {
      body: input.body,
      images: photos.map((photo, position) => {
        if (photo.kind === "new") return stored.get(position)!;
        const { alt: _previousAlt, ...image } = byPath.get(photo.path)!;
        return withAlt(image, photo.alt);
      }),
    })
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
async function removeImages(images: NewsImage[], store: IPublicImageStore): Promise<void> {
  if (images.length === 0) return;
  try {
    await store.remove(images.map((image) => image.path));
  } catch (err) {
    console.error("[News] Failed to remove images from storage:", err);
  }
}
