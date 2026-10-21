import { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { NEWS_CONFIG } from "@/lib/news/config";
import { listNews } from "@/lib/news/service";
import type { NewsPostPage } from "@/lib/news/types";
import { NewsManager } from "@/components/admin/news/NewsManager";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Publications (texte et photos) affichées sur la page d'accueil et dans la section « Nos actualités »",
};

/** First page of posts, or null when the table cannot be read. */
async function loadFirstPage(): Promise<NewsPostPage | null> {
  try {
    return await listNews(0, NEWS_CONFIG.listPageSize);
  } catch (err) {
    console.error("[AdminNewsPage] Failed to load posts:", err);
    return null;
  }
}

export default async function AdminNewsPage() {
  const [{ store }, initial] = await Promise.all([getAppSettings(), loadFirstPage()]);

  return (
    <NewsManager
      initialPosts={initial?.items ?? []}
      initialTotal={initial?.total ?? 0}
      loadFailed={initial === null}
      storeName={store.storeName}
      now={new Date().toISOString()}
    />
  );
}
