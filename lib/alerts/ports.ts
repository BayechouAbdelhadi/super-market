import type { NewSiteAlert, SiteAlert, SiteAlertPage } from "./types";

/**
 * Domain Port: storage of the site alerts.
 */
export interface ISiteAlertRepository {
  /** Newest first. */
  list(offset: number, limit: number): Promise<SiteAlertPage>;
  /** Active alerts, newest first, at most `limit`. */
  listActive(limit: number): Promise<SiteAlert[]>;
  create(alert: NewSiteAlert): Promise<SiteAlert>;
  /** Returns null when the alert does not exist. */
  setActive(id: string, isActive: boolean): Promise<SiteAlert | null>;
  /** Returns false when the alert does not exist. */
  delete(id: string): Promise<boolean>;
}
