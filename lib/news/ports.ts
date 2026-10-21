import type { NewNewsPost, NewsPost, NewsPostContent, NewsPostPage } from "./types";

/**
 * Domain Port: storage of the news posts.
 */
export interface INewsRepository {
  /** All posts, newest first. */
  list(offset: number, limit: number): Promise<NewsPostPage>;
  /** Published posts only, newest first. */
  listPublished(offset: number, limit: number): Promise<NewsPostPage>;
  /** Returns null when the post does not exist. */
  findById(id: string): Promise<NewsPost | null>;
  create(post: NewNewsPost): Promise<NewsPost>;
  /** Replaces the text and photos and stamps `updatedAt`. Returns null when the post does not exist. */
  updateContent(id: string, content: NewsPostContent): Promise<NewsPost | null>;
  /** Returns null when the post does not exist. */
  setPublished(id: string, isPublished: boolean): Promise<NewsPost | null>;
  /** Returns the deleted post (so its photos can be removed), or null when it does not exist. */
  delete(id: string): Promise<NewsPost | null>;
}

// Photos go through the shared media ports (lib/media/ports.ts): IImageProcessor, IPublicImageStore.
