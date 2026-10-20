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

/** Store closed all day from `startDate` to `endDate` included ("YYYY-MM-DD", store-local), e.g. a bank holiday. */
export interface ExceptionalClosure {
  id: string;
  startDate: string;
  endDate: string;
  /** Shown to customers, e.g. "Noël". May be empty. */
  reason: string;
}

/** Everything that decides when the store is open: the regular week, minus exceptional closures. */
export interface OpeningHours {
  weekly: WeeklySchedule;
  closures: ExceptionalClosure[];
}

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

/** How far ahead the next opening is searched (closures can span several weeks). */
const NEXT_OPENING_LOOKAHEAD_DAYS = 366;

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

/** Day of week, calendar date ("YYYY-MM-DD") and minutes since midnight at `date`, in `timeZone`. */
export function getZonedDayTime(date: Date, timeZone: string): { day: DayIndex; date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAY_INDEX[part("weekday")] ?? 0,
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

/** "2026-12-31" + 1 → "2027-01-01" (calendar arithmetic, no time zone involved). */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** The closure covering `isoDate`, if any. */
export function findClosure(isoDate: string, closures: ExceptionalClosure[]): ExceptionalClosure | undefined {
  return closures.find((closure) => closure.startDate <= isoDate && isoDate <= closure.endDate);
}

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-12-25" → "25 déc." */
export function formatShortDate(isoDate: string): string {
  return SHORT_DATE.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "25 déc." for one day, "24 déc. – 2 janv." for a range. */
export function formatClosureDates(closure: Pick<ExceptionalClosure, "startDate" | "endDate">): string {
  if (closure.startDate === closure.endDate) return formatShortDate(closure.startDate);
  return `${formatShortDate(closure.startDate)} – ${formatShortDate(closure.endDate)}`;
}

/** Closures not yet over that start within `withinDays` of `date` (store-local), soonest first. */
export function getUpcomingClosures(
  date: Date,
  closures: ExceptionalClosure[],
  timeZone: string,
  withinDays: number
): ExceptionalClosure[] {
  const today = getZonedDayTime(date, timeZone).date;
  const horizon = addDays(today, withinDays);
  return closures
    .filter((closure) => closure.endDate >= today && closure.startDate <= horizon)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getOpeningStatus(
  date: Date,
  schedule: WeeklySchedule,
  timeZone: string,
  closures: ExceptionalClosure[] = []
): OpeningStatus {
  const { day, date: todayDate, minutes } = getZonedDayTime(date, timeZone);
  const closedToday = Boolean(findClosure(todayDate, closures));
  const closedLabel = closedToday ? "Fermeture exceptionnelle" : "Fermé";

  if (!closedToday) {
    const today = schedule[day];
    const current = today.find((range) => minutes >= toMinutes(range.open) && minutes < toMinutes(range.close));
    if (current) {
      return { isOpen: true, label: "Ouvert", detail: `Ferme à ${formatTime(current.close)}`, dayIndex: day };
    }

    const laterToday = today.find((range) => minutes < toMinutes(range.open));
    if (laterToday) {
      return { isOpen: false, label: closedLabel, detail: `Ouvre à ${formatTime(laterToday.open)}`, dayIndex: day };
    }
  }

  for (let offset = 1; offset <= NEXT_OPENING_LOOKAHEAD_DAYS; offset++) {
    const nextDate = addDays(todayDate, offset);
    if (findClosure(nextDate, closures)) continue;
    const nextDay = ((day + offset) % 7) as DayIndex;
    const first = schedule[nextDay][0];
    if (first) {
      const when =
        offset === 1 ? "demain" : offset < 7 ? DAY_NAMES[nextDay].toLowerCase() : `le ${formatShortDate(nextDate)}`;
      return { isOpen: false, label: closedLabel, detail: `Ouvre ${when} à ${formatTime(first.open)}`, dayIndex: day };
    }
  }

  return { isOpen: false, label: closedLabel, detail: "Horaires non communiqués", dayIndex: day };
}

/** True when every day of the week has at least one opening range. */
export function isOpenEveryDay(schedule: WeeklySchedule): boolean {
  return WEEK_ORDER.every((day) => schedule[day].length > 0);
}

export interface DayGroup {
  /** "Lun – Ven", or a single day "Sam" */
  days: string;
  hours: string;
}

/** Consecutive days (Monday first) sharing the same hours, merged into one line. */
export function groupWeek(schedule: WeeklySchedule): DayGroup[] {
  const groups: { first: DayIndex; last: DayIndex; hours: string }[] = [];
  for (const day of WEEK_ORDER) {
    const hours = formatDayHours(schedule[day]);
    const previous = groups[groups.length - 1];
    if (previous && previous.hours === hours) {
      previous.last = day;
    } else {
      groups.push({ first: day, last: day, hours });
    }
  }
  const short = (day: DayIndex) => DAY_NAMES[day].slice(0, 3);
  return groups.map(({ first, last, hours }) => ({
    days: first === last ? short(first) : `${short(first)} – ${short(last)}`,
    hours,
  }));
}
