import { createAdminClient } from "@/lib/supabase/admin";
import type { INewsRepository } from "../ports";
import type { NewNewsPost, NewsImage, NewsPost, NewsPostContent, NewsPostPage } from "../types";

const TABLE = "news_posts";
const COLUMNS = "id, body, images, is_published, created_at, created_by, updated_at";

interface NewsPostRow {
  id: string;
  body: string;
  images: NewsImage[] | null;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
}

function toPost(row: NewsPostRow): NewsPost {
  return {
    id: row.id,
    body: row.body,
    images: row.images ?? [],
    isPublished: row.is_published,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  };
}

/** Throws a descriptive error for a failed Supabase call, so callers never mistake a failure for success. */
function check(error: { message: string; code?: string } | null, operation: string): void {
  if (error) {
    throw new Error(`[SupabaseNewsRepo] ${operation} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  }
}

/**
 * Infrastructure Adapter: news posts stored in the Supabase `news_posts` table (photos as a jsonb array).
 */
export class SupabaseNewsRepository implements INewsRepository {
  async list(offset: number, limit: number): Promise<NewsPostPage> {
    const { data, error, count } = await createAdminClient()
      .from(TABLE)
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "list");
    return { items: (data ?? []).map(toPost), total: count ?? 0 };
  }

  async listPublished(offset: number, limit: number): Promise<NewsPostPage> {
    const { data, error, count } = await createAdminClient()
      .from(TABLE)
      .select(COLUMNS, { count: "exact" })
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "listPublished");
    return { items: (data ?? []).map(toPost), total: count ?? 0 };
  }

  async findById(id: string): Promise<NewsPost | null> {
    const { data, error } = await createAdminClient().from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
    check(error, "findById");
    return data ? toPost(data as NewsPostRow) : null;
  }

  async create(post: NewNewsPost): Promise<NewsPost> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .insert({ id: post.id, body: post.body, images: post.images, created_by: post.createdBy })
      .select(COLUMNS)
      .single();
    check(error, "create");
    return toPost(data as NewsPostRow);
  }

  async updateContent(id: string, content: NewsPostContent): Promise<NewsPost | null> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .update({ body: content.body, images: content.images, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    check(error, "updateContent");
    return data ? toPost(data as NewsPostRow) : null;
  }

  async setPublished(id: string, isPublished: boolean): Promise<NewsPost | null> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .update({ is_published: isPublished })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    check(error, "setPublished");
    return data ? toPost(data as NewsPostRow) : null;
  }

  async delete(id: string): Promise<NewsPost | null> {
    const { data, error } = await createAdminClient().from(TABLE).delete().eq("id", id).select(COLUMNS).maybeSingle();
    check(error, "delete");
    return data ? toPost(data as NewsPostRow) : null;
  }
}
