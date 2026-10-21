import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils/app-url";

/**
 * Never crawled: the API and the dashboards (behind sign-in anyway).
 * Sign-in, account and unsubscribe pages are NOT listed: they carry `noindex` (PRIVATE_PAGE_ROBOTS),
 * and a crawler only sees that tag on pages it may fetch. Blocking them here could leave their bare
 * URLs in search results.
 */
const BLOCKED_PATHS = ["/api/", "/admin/", "/cashier/", "/customers", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: BLOCKED_PATHS },
      // Link previews (Facebook, WhatsApp, Instagram) read the public pages
      { userAgent: ["facebookexternalhit", "Facebot", "meta-externalagent"], allow: "/", disallow: BLOCKED_PATHS },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
