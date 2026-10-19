import { describe, expect, it } from "vitest";
import { formatDayHours, formatTime, getOpeningStatus, type WeeklySchedule } from "@/lib/store/opening-hours";

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
