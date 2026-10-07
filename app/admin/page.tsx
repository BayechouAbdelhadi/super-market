import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Tableau de bord",
  description: "Indicateurs d'activité commerciale, ventes du jour et flux des passages en caisse.",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || "ADMIN";
  const email = user?.email || "";

  // Fetch real analytics directly from Supabase
  const initialAnalytics = await getDashboardAnalytics();

  return (
    <DashboardLayout role={role} email={email}>
      <AnalyticsDashboard initialData={initialAnalytics} />
    </DashboardLayout>
  );
}
