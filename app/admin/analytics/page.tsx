import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { getAppSettings } from "@/lib/settings/service";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Analytics & Indicateurs",
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
