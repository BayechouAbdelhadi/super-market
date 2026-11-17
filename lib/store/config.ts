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

/** Shown on legal pages in place of a `STORE_COMPANY` value that is still empty. Search the site for it before launch. */
export const LEGAL_PLACEHOLDER = "À compléter";

/**
 * Legal identity of the company running the store, shown in the legal notice and the privacy policy.
 * Source: national business registry (recherche-entreprises.api.gouv.fr), checked 2026-11-17.
 * `capital`, `rcsCity` are not in the open registry: filled from the Kbis. `host` is Hostinger's EU entity per its terms of service (check it matches the invoice).
 * An empty value shows `LEGAL_PLACEHOLDER` on the legal pages.
 */
export const STORE_COMPANY = {
  legalName: "SUPER MARKET CALAIS",
  legalForm: "Société par actions simplifiée (SAS)",
  /** Share capital in euros, as written on the Kbis (e.g. "1 000 €") */
  capital: "1 000 €",
  siren: "885 125 666",
  siret: "885 125 666 00010",
  /** Registry city, as written on the Kbis (e.g. "Boulogne-sur-Mer") */
  rcsCity: "Boulogne-sur-Mer",
  vatNumber: "FR70 885 125 666",
  nafCode: "47.11B — Commerce d'alimentation générale",
  registeredOffice: "205 Avenue Antoine de Saint-Exupéry, 62100 Calais, France",
  /** Legal representative named as publication director */
  publicationDirector: "Aydogan Karaaslan",
  publicationDirectorRole: "Directeur général",
  /** Hosting provider (legal notice requirement): the VPS provider. */
  host: {
    name: "Hostinger International Ltd.",
    address: "61 Lordou Vironos Str., 6023 Larnaca, Chypre",
    phone: "",
    website: "https://www.hostinger.fr",
    /** Where the VPS (and so the database) runs; chosen when the VPS was created */
    serverLocation: "Allemagne (Union européenne)",
  },
  /** Consumer mediator: name and contact from the mediation membership. Leave the name empty when there is none: the mention is then left out of the legal pages. */
  mediator: { name: "", address: "", website: "" },
} as const;

/** Payment methods accepted at the till (practical info, FAQ, structured data), as they read mid-sentence. */
export const STORE_PAYMENT_METHODS = ["carte bancaire", "sans contact", "Apple Pay", "Google Pay", "espèces"] as const;

/** Parcel carriers of the in-store pickup point. */
export const STORE_PICKUP_CARRIERS = "La Poste, Chronopost et partenaires";

/** The store's social media pages. */
export const STORE_SOCIAL = {
  facebookUrl: "https://www.facebook.com/supermarketcalais",
} as const;

/** Access tips shown under the map. */
export const STORE_ACCESS = {
  landmark: "Quartier Saint-Exupéry, face aux commerces",
  transport: "Lignes Imag'in Calais à 2 min à pied",
  parking: "Places gratuites devant le magasin",
} as const;
