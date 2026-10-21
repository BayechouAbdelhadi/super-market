import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils/app-url";
import { getLatestNewsPost } from "@/lib/news/service";

// Rebuilt at most hourly, so a new post updates the dates without querying the database on every crawl
export const revalidate = 3600;

/** Public, indexable pages. Private pages (sign-in, account…) are noindex and stay out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  // Never throws: without news (or database), the pages still get listed
  const latest = await getLatestNewsPost();
  const newsUpdatedAt = latest ? new Date(latest.updatedAt ?? latest.createdAt) : undefined;

  return [
    // The home page shows the latest post, so it changes with it
    { url: siteUrl, lastModified: newsUpdatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/actualites`, lastModified: newsUpdatedAt, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/politique-de-confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
