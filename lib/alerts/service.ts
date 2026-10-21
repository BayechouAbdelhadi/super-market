import type { ISiteAlertRepository } from "./ports";
import type { SiteAlert, SiteAlertPage } from "./types";
import type { CreateAlertInput } from "./validation";
import { ALERTS_CONFIG, ALERT_LEVEL_SEVERITY } from "./config";
import { SupabaseSiteAlertRepository } from "./adapters/supabase-alert-repository";

const defaultRepo: ISiteAlertRepository = new SupabaseSiteAlertRepository();

/** Most severe first, then newest. */
export function sortAlertsForBanner(alerts: SiteAlert[]): SiteAlert[] {
  return [...alerts].sort(
    (a, b) =>
      ALERT_LEVEL_SEVERITY[b.level] - ALERT_LEVEL_SEVERITY[a.level] ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

export function listAlerts(
  offset: number,
  limit: number,
  repo: ISiteAlertRepository = defaultRepo
): Promise<SiteAlertPage> {
  return repo.list(offset, limit);
}

export function createAlert(
  input: CreateAlertInput,
  createdBy: string | null,
  repo: ISiteAlertRepository = defaultRepo
): Promise<SiteAlert> {
  return repo.create({ message: input.message, level: input.level, createdBy });
}

export function setAlertActive(
  id: string,
  isActive: boolean,
  repo: ISiteAlertRepository = defaultRepo
): Promise<SiteAlert | null> {
  return repo.setActive(id, isActive);
}

export function deleteAlert(id: string, repo: ISiteAlertRepository = defaultRepo): Promise<boolean> {
  return repo.delete(id);
}

/**
 * Alerts to show at the top of the public site. Never throws: a storage failure
 * must not take the site down, it only hides the banners.
 */
export async function getBannerAlerts(repo: ISiteAlertRepository = defaultRepo): Promise<SiteAlert[]> {
  try {
    const active = await repo.listActive(ALERTS_CONFIG.activeFetchLimit);
    return sortAlertsForBanner(active).slice(0, ALERTS_CONFIG.bannerMaxCount);
  } catch (err) {
    console.error("[SiteAlerts] Failed to load banner alerts:", err);
    return [];
  }
}
