import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { getAppSettings } from "@/lib/settings/service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics & indicateurs",
  description: "Indicateurs d'activité commerciale, ventes du jour et flux des passages en caisse.",
};

export default async function AdminAnalyticsPage() {
  const [initialAnalytics, settings] = await Promise.all([
    getDashboardAnalytics(),
    getAppSettings(),
  ]);

  return (
    <AnalyticsDashboard
      initialData={initialAnalytics}
      euroToPointsRatio={settings.loyalty.euroToPointsRatio}
    />
  );
}
