/**
 * Opening hours domain: whether the store is open at a given instant, and when it next opens or closes.
 * Pure functions, no framework dependency.
 */

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** One opening range, "HH:MM" in 24h store-local time. */
export interface TimeRange {
  open: string;
  close: string;
}

/** Opening ranges by day (0 = Sunday). An empty list means closed all day. */
export type WeeklySchedule = Record<DayIndex, TimeRange[]>;

export interface OpeningStatus {
  isOpen: boolean;
  /** Short state, e.g. "Ouvert" */
  label: string;
  /** Next change, e.g. "Ferme à 19h30", "Ouvre demain à 9h" */
  detail: string;
  /** Store-local day the status was computed for */
  dayIndex: DayIndex;
}

export const DAY_NAMES: Record<DayIndex, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

/** Monday-first order used to display the week. */
export const WEEK_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAY_INDEX: Record<string, DayIndex> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** "09:00" → "9h", "19:30" → "19h30" */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}h${minutes === "00" ? "" : minutes}`;
}

/** "9h – 12h30 · 14h – 19h30", or "Fermé" */
export function formatDayHours(ranges: TimeRange[]): string {
  if (ranges.length === 0) return "Fermé";
  return ranges.map((range) => `${formatTime(range.open)} – ${formatTime(range.close)}`).join(" · ");
}

/** Day of week and minutes since midnight at `date`, in `timeZone`. */
export function getZonedDayTime(date: Date, timeZone: string): { day: DayIndex; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAY_INDEX[part("weekday")] ?? 0,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export function getOpeningStatus(date: Date, schedule: WeeklySchedule, timeZone: string): OpeningStatus {
  const { day, minutes } = getZonedDayTime(date, timeZone);
  const today = schedule[day];

  const current = today.find((range) => minutes >= toMinutes(range.open) && minutes < toMinutes(range.close));
  if (current) {
    return { isOpen: true, label: "Ouvert", detail: `Ferme à ${formatTime(current.close)}`, dayIndex: day };
  }

  const laterToday = today.find((range) => minutes < toMinutes(range.open));
  if (laterToday) {
    return { isOpen: false, label: "Fermé", detail: `Ouvre à ${formatTime(laterToday.open)}`, dayIndex: day };
  }

  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = ((day + offset) % 7) as DayIndex;
    const first = schedule[nextDay][0];
    if (first) {
      const when = offset === 1 ? "demain" : DAY_NAMES[nextDay].toLowerCase();
      return { isOpen: false, label: "Fermé", detail: `Ouvre ${when} à ${formatTime(first.open)}`, dayIndex: day };
    }
  }

  return { isOpen: false, label: "Fermé", detail: "Horaires non communiqués", dayIndex: day };
}
