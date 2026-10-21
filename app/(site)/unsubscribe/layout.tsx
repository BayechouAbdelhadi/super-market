import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

// The page is a client component (reads the link's query string), so its metadata lives here
export const metadata: Metadata = { title: "Désabonnement", robots: PRIVATE_PAGE_ROBOTS };

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
