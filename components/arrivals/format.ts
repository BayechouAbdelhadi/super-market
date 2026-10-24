import { STORE_TIME_ZONE } from "@/lib/store/config";

const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: STORE_TIME_ZONE,
});

// A pickup day is a calendar date: formatted in UTC from its noon so no time zone shifts it
const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export const formatEuro = (amount: number) => euroFormatter.format(amount);

export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso));

/** "YYYY-MM-DD" → "samedi 14 novembre". */
export const formatDay = (day: string) => dayFormatter.format(new Date(`${day}T12:00:00Z`));

/** ISO date → value of an `<input type="datetime-local">` in the browser's time zone. */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
