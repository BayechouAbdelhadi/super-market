import type { ArrivalCategory, ArrivalErrorCode, ArrivalPhase, ReservationStatus } from "./types";

export const ARRIVALS_CONFIG = {
  /** Text limits, mirrored by the CHECK constraints in supabase/arrivals.sql. */
  titleMaxLength: 120,
  descriptionMaxLength: 1000,
  /** Products in one arrival. */
  maxItems: 20,
  /** Upper bounds that catch typos (a price of 1 250 € for a tray). */
  maxUnitPrice: 1000,
  maxStock: 10000,
  /** Most units of one product in a single reservation. */
  maxQuantityPerLine: 50,
  /** Category of a new arrival (the admin does not choose it). */
  defaultCategory: "CHICKEN",
  /** Sales unit of every product; its weight completes it ("barquette de 500 g"). */
  unitLabel: "barquette",
  /** Tray weight bounds, in grams. */
  minWeightGrams: 50,
  maxWeightGrams: 10000,
  /** Arrivals shown at once on the home page. */
  homeMaxCount: 3,
  /** Admin list pagination. */
  listPageSize: 10,
  listMaxPageSize: 50,
  /** Reservations of one arrival (admin). */
  reservationsPageSize: 20,
  reservationsMaxPageSize: 100,
  /** "Mes réservations" pagination. */
  customerReservationsPageSize: 10,
  customerReservationsMaxPageSize: 50,
} as const;

export const ARRIVAL_CATEGORY_LABELS: Record<ArrivalCategory, string> = {
  CHICKEN: "Poulet",
};

/** Products an admin can include in an arrival, by category. */
export const ARRIVAL_PRODUCTS: Record<ArrivalCategory, readonly string[]> = {
  CHICKEN: ["Filet de poulet", "Ailes de poulet", "Cuisse de poulet", "Pilon de poulet"],
};

export interface ArrivalImage {
  src: string;
  alt: string;
}

/** Static photo of each category (card cover, and fallback for a product without its own). */
export const ARRIVAL_CATEGORY_IMAGES: Record<ArrivalCategory, ArrivalImage> = {
  CHICKEN: { src: "/categories/poulet-frais-sample.jpg", alt: "Poulet frais en barquette" },
};

/** Static photo of a product, by name (see ARRIVAL_PRODUCTS). Files live in public/arrivals. */
export const ARRIVAL_PRODUCT_IMAGES: Partial<Record<string, ArrivalImage>> = {
  "Filet de poulet": { src: "/arrivals/filet-de-poulet.webp", alt: "Filets de poulet frais" },
  "Cuisse de poulet": { src: "/arrivals/cuisse-de-poulet.webp", alt: "Cuisse de poulet fraîche" },
};

export function arrivalProductImage(category: ArrivalCategory, productName: string): ArrivalImage {
  return ARRIVAL_PRODUCT_IMAGES[productName] ?? ARRIVAL_CATEGORY_IMAGES[category];
}

export const ARRIVAL_PHASE_LABELS: Record<ArrivalPhase, string> = {
  SCHEDULED: "Bientôt ouvert",
  OPEN: "Réservations ouvertes",
  CLOSED: "Réservations clôturées",
  FINISHED: "Terminé",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: "Réservée",
  REMINDED: "Client relancé",
  COLLECTED: "Récupérée",
  CANCELLED: "Annulée",
  NO_SHOW: "Non récupérée",
};

/** Label of the button that moves a reservation to the status. */
export const RESERVATION_ACTION_LABELS: Record<Exclude<ReservationStatus, "CONFIRMED">, string> = {
  REMINDED: "Marquer relancé",
  COLLECTED: "Marquer récupérée",
  CANCELLED: "Annuler",
  NO_SHOW: "Non récupérée",
};

/** French message for each business error, shown to customers and staff. */
export const ARRIVAL_ERROR_MESSAGES: Record<ArrivalErrorCode, string> = {
  ARRIVAL_NOT_FOUND: "Arrivage introuvable.",
  RESERVATION_NOT_OPEN: "Les réservations ne sont pas encore ouvertes pour cet arrivage.",
  RESERVATION_CLOSED: "Les réservations sont clôturées pour cet arrivage.",
  ALREADY_RESERVED: "Vous avez déjà une réservation pour cet arrivage. Annulez-la pour en faire une nouvelle.",
  ITEM_NOT_FOUND: "Un article de la réservation n'existe plus. Rechargez la page.",
  MAX_PER_CUSTOMER: "La quantité dépasse la limite autorisée par client pour un article.",
  OUT_OF_STOCK: "Stock insuffisant pour un article : quelqu'un vient de réserver avant vous.",
  RESERVATION_NOT_FOUND: "Réservation introuvable.",
  INVALID_TRANSITION: "Cette réservation ne peut plus passer à ce statut.",
  STOCK_BELOW_RESERVED: "Le stock ne peut pas être inférieur à la quantité déjà réservée.",
  ITEM_HAS_RESERVATIONS: "Un article déjà réservé ne peut pas être retiré de l'arrivage.",
  HAS_ACTIVE_RESERVATIONS:
    "Cet arrivage a des réservations en cours : clôturez-le ou annulez ses réservations avant de le supprimer.",
};
