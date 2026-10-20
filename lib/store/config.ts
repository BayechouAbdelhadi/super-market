import type { WeeklySchedule } from "./opening-hours";

/**
 * Physical store facts shown on the public site.
 * Editable store identity (name, tagline, address, phone, email) and opening hours live in the admin settings;
 * what is here changes rarely and has no admin screen.
 */

/** Time zone the opening hours are expressed in. */
export const STORE_TIME_ZONE = "Europe/Paris";

/** Default opening hours by day (0 = Sunday … 6 = Saturday), as "HH:MM" ranges. Admins edit them in the settings. */
export const DEFAULT_OPENING_HOURS: WeeklySchedule = {
  0: [{ open: "09:00", close: "19:30" }],
  1: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }],
  2: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }],
  3: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }],
  4: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }],
  5: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "19:30" }],
  6: [{ open: "09:00", close: "19:30" }],
};

/** Limits of the opening hours editor. */
export const OPENING_HOURS_LIMITS = {
  /** Opening ranges per day (e.g. morning + afternoon) */
  maxRangesPerDay: 3,
  /** Exceptional closures stored at once */
  maxClosures: 50,
  /** Characters in a closure reason */
  maxClosureReasonLength: 80,
} as const;

/** Range prefilled when the admin opens a closed day or adds a range in the hours editor. */
export const NEW_TIME_RANGE = { open: "09:00", close: "19:00" } as const;

/** Upcoming exceptional closures are announced on the public site this many days ahead. */
export const UPCOMING_CLOSURES_WINDOW_DAYS = 30;

const COORDINATES = { lat: 50.9465158, lng: 1.8973909 };

export const STORE_LOCATION = {
  coordinates: COORDINATES,
  googleMapsUrl:
    "https://www.google.com/maps/place/Super+Market/@50.9465158,1.894816,17z/data=!3m1!4b1!4m6!3m5!1s0x47dc408d16b83147:0x741d64b6f3748726!8m2!3d50.9465158!4d1.8973909!16s%2Fg%2F11s0z94vkk",
  wazeUrl: `https://waze.com/ul?ll=${COORDINATES.lat},${COORDINATES.lng}&navigate=yes`,
  embedUrl:
    "https://maps.google.com/maps?q=Super+Market+205+Avenue+Antoine+de+Saint-Exup%C3%A9ry+Calais&z=16&ie=UTF8&iwloc=&output=embed",
} as const;

/** Access tips shown under the map. */
export const STORE_ACCESS = {
  landmark: "Quartier Saint-Exupéry, face aux commerces",
  transport: "Lignes Imag'in Calais à 2 min à pied",
  parking: "Places gratuites devant le magasin",
} as const;
