export const ALERT_LEVELS = ["INFO", "WARNING", "CRITICAL"] as const;

export type AlertLevel = (typeof ALERT_LEVELS)[number];

/** Message shown in a banner at the top of the public site. */
export interface SiteAlert {
  id: string;
  message: string;
  level: AlertLevel;
  /** Hidden alerts stay in the list but are not shown on the site. */
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface NewSiteAlert {
  message: string;
  level: AlertLevel;
  createdBy: string | null;
}

export interface SiteAlertPage {
  items: SiteAlert[];
  total: number;
}
