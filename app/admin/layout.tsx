import type { Metadata } from "next";
import { ProtectedDashboard } from "@/components/ui/ProtectedDashboard";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";
import { ADMIN_APP_TITLE, ADMIN_MANIFEST_PATH } from "@/lib/seo/manifests";

// Dashboards stay out of search results, whatever the page.
// The admin manifest replaces the public one here, so installing from /admin gives the admin app (store tablet).
export const metadata: Metadata = {
  robots: PRIVATE_PAGE_ROBOTS,
  manifest: ADMIN_MANIFEST_PATH,
  appleWebApp: { capable: true, title: ADMIN_APP_TITLE, statusBarStyle: "default" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      {children}
    </ProtectedDashboard>
  );
}
