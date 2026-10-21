import { STORE_TIME_ZONE } from "@/lib/store/config";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Older posts show their date instead of "il y a …". */
const RELATIVE_MAX_DAYS = 7;

const relative = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: STORE_TIME_ZONE });
const fullDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: STORE_TIME_ZONE });

/** Social-media style date: "à l'instant", "il y a 5 minutes", "hier", then "12 octobre 2026". */
export function formatNewsDate(createdAt: string, now: Date): string {
  const date = new Date(createdAt);
  // A post created after `now` (clock skew, just published) is "now"
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < MINUTE) return "À l'instant";
  if (elapsed < HOUR) return capitalize(relative.format(-Math.floor(elapsed / MINUTE), "minute"));
  if (elapsed < DAY) return capitalize(relative.format(-Math.floor(elapsed / HOUR), "hour"));
  if (elapsed < RELATIVE_MAX_DAYS * DAY) return capitalize(relative.format(-Math.floor(elapsed / DAY), "day"));
  return shortDate.format(date);
}

/** Full date and time, for the tooltip of the short date. */
export function formatNewsFullDate(createdAt: string): string {
  return capitalize(fullDate.format(new Date(createdAt)));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
