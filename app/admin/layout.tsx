import type { Metadata } from "next";
import { ProtectedDashboard } from "@/components/ui/ProtectedDashboard";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

// Dashboards stay out of search results, whatever the page
export const metadata: Metadata = { robots: PRIVATE_PAGE_ROBOTS };

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
