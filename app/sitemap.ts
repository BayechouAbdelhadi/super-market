import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils/app-url";
import { getLatestNewsPost, listPublishedNews } from "@/lib/news/service";
import { newsPostPath } from "@/lib/news/permalink";
import type { NewsPost } from "@/lib/news/types";
import { DEPARTMENTS, departmentPath } from "@/lib/store/departments";

/** Most news posts listed (newest first): keeps the query bounded. */
const SITEMAP_MAX_POSTS = 500;

// Rebuilt at most hourly, so a new post updates the dates without querying the database on every crawl
export const revalidate = 3600;

/** Public, indexable pages. Private pages (sign-in, account…) are noindex and stay out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  // Never throws: without news (or database), the pages still get listed
  const latest = await getLatestNewsPost();
  let posts: NewsPost[] = [];
  try {
    posts = (await listPublishedNews(0, SITEMAP_MAX_POSTS)).items;
  } catch (err) {
    console.error("[sitemap] Failed to list news posts:", err);
  }
  const newsUpdatedAt = latest ? new Date(latest.updatedAt ?? latest.createdAt) : undefined;

  return [
    // The home page shows the latest post, so it changes with it
    { url: siteUrl, lastModified: newsUpdatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/actualites`, lastModified: newsUpdatedAt, changeFrequency: "daily", priority: 0.8 },
    ...DEPARTMENTS.map((department) => ({
      url: `${siteUrl}${departmentPath(department.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}${newsPostPath(post)}`,
      lastModified: new Date(post.updatedAt ?? post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${siteUrl}/politique-de-confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
