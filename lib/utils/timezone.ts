/**
 * Centralized Timezone Management (Europe/Paris)
 *
 * Ensures all backend date comparisons, cron schedules, job triggers,
 * and daily limit quotas strictly follow French/Paris local time.
 */

export const TIMEZONE_PARIS = "Europe/Paris";

/**
 * Returns the date as a 'YYYY-MM-DD' formatted string in the Europe/Paris timezone.
 */
export function getParisDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: TIMEZONE_PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns the current time as a 'HH:mm' formatted string in the Europe/Paris timezone.
 */
export function getParisTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE_PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Returns an object with date, time, and ISO string formatted for Paris.
 */
export function getParisNow(date: Date = new Date()): {
  dateStr: string;
  timeStr: string;
  isoWithParisTime: string;
} {
  const dateStr = getParisDateString(date);
  const timeStr = getParisTimeString(date);
  return {
    dateStr,
    timeStr,
    isoWithParisTime: `${dateStr}T${timeStr}:00 (Europe/Paris)`,
  };
}

/**
 * Checks whether a given 'YYYY-MM-DD' string matches today in Paris.
 */
export function isTodayInParis(dateStr: string, referenceDate: Date = new Date()): boolean {
  return dateStr === getParisDateString(referenceDate);
}

/**
 * Checks whether a given 'YYYY-MM-DD' string is in the past compared to today in Paris.
 */
export function isPastInParis(dateStr: string, referenceDate: Date = new Date()): boolean {
  return dateStr < getParisDateString(referenceDate);
}

/**
 * Checks whether a given 'YYYY-MM-DD' string is in the future compared to today in Paris.
 */
export function isFutureInParis(dateStr: string, referenceDate: Date = new Date()): boolean {
  return dateStr > getParisDateString(referenceDate);
}
