import { Metadata } from "next";
import { ALERTS_CONFIG } from "@/lib/alerts/config";
import { listAlerts } from "@/lib/alerts/service";
import type { SiteAlertPage } from "@/lib/alerts/types";
import { AlertsManager } from "@/components/admin/alerts/AlertsManager";

export const metadata: Metadata = {
  title: "Alertes du site",
  description: "Bannières d'information, d'avertissement ou critiques affichées en haut du site public",
};

export default async function AdminAlertsPage() {
  let initial: SiteAlertPage = { items: [], total: 0 };
  let loadFailed = false;
  try {
    initial = await listAlerts(0, ALERTS_CONFIG.listPageSize);
  } catch (err) {
    console.error("[AdminAlertsPage] Failed to load alerts:", err);
    loadFailed = true;
  }

  return <AlertsManager initialAlerts={initial.items} initialTotal={initial.total} loadFailed={loadFailed} />;
}
