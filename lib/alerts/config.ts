import type { AlertLevel } from "./types";

export const ALERTS_CONFIG = {
  /** Longest message an admin can publish (one or two lines on a phone). */
  messageMaxLength: 280,
  /** Most banners shown at once on the public site. */
  bannerMaxCount: 3,
  /** Active alerts read to pick the banners (bounded query, sorted by severity afterwards). */
  activeFetchLimit: 20,
  /** Admin list pagination. */
  listPageSize: 10,
  listMaxPageSize: 50,
  /** localStorage key holding the ids of the alerts a visitor closed. */
  dismissedStorageKey: "site-alerts:dismissed",
  /** Most closed alert ids kept per visitor (oldest dropped first). */
  dismissedMaxIds: 50,
} as const;

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  INFO: "Information",
  WARNING: "Avertissement",
  CRITICAL: "Critique",
};

export const ALERT_LEVEL_DESCRIPTIONS: Record<AlertLevel, string> = {
  INFO: "Nouveauté, horaires exceptionnels, arrivage…",
  WARNING: "Perturbation, rupture, travaux…",
  CRITICAL: "Fermeture imprévue, rappel produit…",
};

/** Higher shows first. */
export const ALERT_LEVEL_SEVERITY: Record<AlertLevel, number> = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
};
