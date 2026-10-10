import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { getAppSettings } from "@/lib/settings/service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Analytics & Indicateurs",
  description: "Indicateurs d'activité commerciale, ventes du jour et flux des passages en caisse.",
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const [{ data: { user } }, initialAnalytics, settings] = await Promise.all([
    supabase.auth.getUser(),
    getDashboardAnalytics(),
    getAppSettings(),
  ]);

  const role = user?.user_metadata?.role || "ADMIN";
  const email = user?.email || "";

  return (
    <DashboardLayout role={role} email={email}>
      <AnalyticsDashboard
        initialData={initialAnalytics}
        euroToPointsRatio={settings.loyalty.euroToPointsRatio}
      />
    </DashboardLayout>
  );
}
