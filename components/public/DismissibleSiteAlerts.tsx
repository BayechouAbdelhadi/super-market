"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SiteAlert } from "@/lib/alerts/types";
import { SiteAlertBanner } from "@/components/ui/SiteAlertBanner";
import { dismissAlert, dismissedStore, parseDismissedIds } from "./dismissed-alerts";

/** The site banners minus the ones this visitor closed (remembered in localStorage). */
export function DismissibleSiteAlerts({ alerts }: { alerts: SiteAlert[] }) {
  const raw = useSyncExternalStore(dismissedStore.subscribe, dismissedStore.getSnapshot, dismissedStore.getServerSnapshot);
  const dismissed = useMemo(() => new Set(parseDismissedIds(raw)), [raw]);

  return alerts
    .filter((alert) => !dismissed.has(alert.id))
    .map((alert) => (
      <SiteAlertBanner
        key={alert.id}
        alertId={alert.id}
        level={alert.level}
        message={alert.message}
        onDismiss={() => dismissAlert(alert.id)}
      />
    ));
}
