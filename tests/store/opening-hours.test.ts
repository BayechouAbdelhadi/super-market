import { describe, expect, it } from "vitest";
import {
  addDays,
  formatClosureDates,
  formatDayHours,
  formatTime,
  getOpeningStatus,
  getUpcomingClosures,
  groupWeek,
  isOpenEveryDay,
  type ExceptionalClosure,
  type WeeklySchedule,
} from "@/lib/store/opening-hours";

const SPLIT = [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }];
const SCHEDULE: WeeklySchedule = {
  0: [],
  1: SPLIT,
  2: SPLIT,
  3: SPLIT,
  4: SPLIT,
  5: SPLIT,
  6: [{ open: "09:00", close: "19:30" }],
};

const TZ = "Europe/Paris";
// 2026-10-19 is a Monday; Paris is UTC+2 until 2026-10-25
const at = (iso: string) => new Date(iso);

describe("getOpeningStatus", () => {
  it("is open during a range and announces the closing time", () => {
    expect(getOpeningStatus(at("2026-10-19T08:00:00Z"), SCHEDULE, TZ)).toEqual({
      isOpen: true,
      label: "Ouvert",
      detail: "Ferme à 12h30",
      dayIndex: 1,
    });
  });

  it("announces the afternoon reopening during the lunch break", () => {
    const status = getOpeningStatus(at("2026-10-19T11:00:00Z"), SCHEDULE, TZ);
    expect(status.isOpen).toBe(false);
    expect(status.detail).toBe("Ouvre à 14h");
  });

  it("treats the closing minute as closed", () => {
    expect(getOpeningStatus(at("2026-10-19T17:30:00Z"), SCHEDULE, TZ).detail).toBe("Ouvre demain à 9h");
  });

  it("skips closed days when finding the next opening", () => {
    // Saturday 20:00 Paris → Sunday closed → Monday
    expect(getOpeningStatus(at("2026-10-24T18:00:00Z"), SCHEDULE, TZ).detail).toBe("Ouvre lundi à 9h");
  });

  it("uses the store time zone, not the machine's", () => {
    // 07:30 UTC is 09:30 in Paris
    expect(getOpeningStatus(at("2026-10-19T07:30:00Z"), SCHEDULE, TZ).isOpen).toBe(true);
  });
});

describe("getOpeningStatus with exceptional closures", () => {
  const closure = (startDate: string, endDate: string, reason = ""): ExceptionalClosure => ({
    id: `${startDate}-${endDate}`,
    startDate,
    endDate,
    reason,
  });

  it("is closed all day during a closure, even within normal hours", () => {
    const status = getOpeningStatus(at("2026-10-19T08:00:00Z"), SCHEDULE, TZ, [closure("2026-10-19", "2026-10-19")]);
    expect(status.isOpen).toBe(false);
    expect(status.label).toBe("Fermeture exceptionnelle");
    expect(status.detail).toBe("Ouvre demain à 9h");
  });

  it("skips closed days when announcing the next opening", () => {
    // Monday evening, Tuesday and Wednesday closed → Thursday
    const status = getOpeningStatus(at("2026-10-19T18:00:00Z"), SCHEDULE, TZ, [closure("2026-10-20", "2026-10-21")]);
    expect(status.label).toBe("Fermé");
    expect(status.detail).toBe("Ouvre jeudi à 9h");
  });

  it("gives a date when the next opening is a week or more away", () => {
    const status = getOpeningStatus(at("2026-10-19T08:00:00Z"), SCHEDULE, TZ, [closure("2026-10-19", "2026-11-01")]);
    expect(status.detail).toBe("Ouvre le 2 nov. à 9h");
  });

  it("ignores closures on other days", () => {
    expect(getOpeningStatus(at("2026-10-19T08:00:00Z"), SCHEDULE, TZ, [closure("2026-12-25", "2026-12-25")]).isOpen).toBe(true);
  });

  it("uses the store-local date around midnight", () => {
    // 22:30 UTC on Oct 19 is already Oct 20 in Paris
    const status = getOpeningStatus(at("2026-10-19T22:30:00Z"), SCHEDULE, TZ, [closure("2026-10-20", "2026-10-20")]);
    expect(status.label).toBe("Fermeture exceptionnelle");
  });

  it("lists closures not over yet within the window, soonest first", () => {
    const closures = [closure("2026-12-25", "2026-12-25"), closure("2026-10-01", "2026-10-02"), closure("2026-10-30", "2026-11-02")];
    expect(getUpcomingClosures(at("2026-10-19T08:00:00Z"), closures, TZ, 30).map((c) => c.startDate)).toEqual(["2026-10-30"]);
  });
});

describe("dates", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });

  it("formats single days and ranges", () => {
    expect(formatClosureDates({ startDate: "2026-12-25", endDate: "2026-12-25" })).toBe("25 déc.");
    expect(formatClosureDates({ startDate: "2026-12-31", endDate: "2027-01-02" })).toBe("31 déc. – 2 janv.");
  });

  it("knows when the store opens every day", () => {
    expect(isOpenEveryDay(SCHEDULE)).toBe(false);
    expect(isOpenEveryDay({ ...SCHEDULE, 0: SPLIT })).toBe(true);
  });
});

describe("formatting", () => {
  it("drops zero minutes", () => {
    expect(formatTime("09:00")).toBe("9h");
    expect(formatTime("19:30")).toBe("19h30");
  });

  it("joins ranges and marks closed days", () => {
    expect(formatDayHours(SPLIT)).toBe("9h – 12h30 · 14h – 19h30");
    expect(formatDayHours([])).toBe("Fermé");
  });
});

describe("groupWeek", () => {
  it("merges consecutive days with the same hours", () => {
    expect(groupWeek(SCHEDULE)).toEqual([
      { days: "Lun – Ven", hours: "9h – 12h30 · 14h – 19h30" },
      { days: "Sam", hours: "9h – 19h30" },
      { days: "Dim", hours: "Fermé" },
    ]);
  });
});
