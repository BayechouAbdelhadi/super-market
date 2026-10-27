export const ARRIVAL_CATEGORIES = ["CHICKEN"] as const;

export type ArrivalCategory = (typeof ARRIVAL_CATEGORIES)[number];

/** Where an arrival stands, derived from its dates and manual closure. */
export type ArrivalPhase = "SCHEDULED" | "OPEN" | "CLOSED" | "FINISHED";

export const RESERVATION_STATUSES = ["CONFIRMED", "REMINDED", "COLLECTED", "CANCELLED", "NO_SHOW"] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Statuses a cashier or admin can set by hand (CONFIRMED is only set by reserving). */
export const STAFF_RESERVATION_STATUSES = ["REMINDED", "COLLECTED", "CANCELLED", "NO_SHOW"] as const;

export type StaffReservationStatus = (typeof STAFF_RESERVATION_STATUSES)[number];

/** Product offered in an arrival, sold by unit (e.g. one tray of chicken). */
export interface ArrivalItem {
  id: string;
  name: string;
  /** Sales unit shown after the quantity, e.g. "barquette de 500 g". */
  unitLabel: string;
  /** Tray weight in grams; null for products created before it was required. */
  weightGrams: number | null;
  unitPrice: number;
  stockTotal: number;
  stockReserved: number;
  /** Most units one customer can reserve; null for no limit. */
  maxPerCustomer: number | null;
  position: number;
}

/** Occasional delivery customers reserve online and collect in store on `pickupDate`. */
export interface Arrival {
  id: string;
  title: string;
  description: string | null;
  category: ArrivalCategory;
  reservationOpensAt: string;
  reservationClosesAt: string;
  /** Store-local day of the pickup, "YYYY-MM-DD". */
  pickupDate: string;
  /** Set when an admin closes reservations before `reservationClosesAt`. */
  closedAt: string | null;
  createdAt: string;
  items: ArrivalItem[];
}

export interface ArrivalPage {
  items: Arrival[];
  total: number;
}

export interface ArrivalItemDraft {
  /** Existing item when editing; absent for a new one. */
  id?: string;
  name: string;
  unitLabel: string;
  weightGrams: number;
  unitPrice: number;
  stockTotal: number;
  maxPerCustomer: number | null;
}

export interface ArrivalDraft {
  title: string;
  description: string | null;
  category: ArrivalCategory;
  reservationOpensAt: string;
  reservationClosesAt: string;
  pickupDate: string;
  items: ArrivalItemDraft[];
}

export interface ReservationLine {
  itemId: string;
  itemName: string;
  unitLabel: string;
  /** Price when the customer reserved: later price changes do not apply. */
  unitPrice: number;
  quantity: number;
}

export interface ReservationCustomer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
}

/** One status change of a reservation, oldest first in `Reservation.history`. */
export interface ReservationEvent {
  status: ReservationStatus;
  at: string;
}

export interface Reservation {
  id: string;
  arrivalId: string;
  status: ReservationStatus;
  totalAmount: number;
  createdAt: string;
  statusChangedAt: string;
  history: ReservationEvent[];
  lines: ReservationLine[];
  arrival: Pick<Arrival, "id" | "title" | "pickupDate" | "reservationClosesAt" | "closedAt">;
  customer: ReservationCustomer;
}

export interface ReservationPage {
  items: Reservation[];
  total: number;
}

export interface ReservationRequestLine {
  itemId: string;
  quantity: number;
}

export interface ArrivalItemStats {
  itemId: string;
  name: string;
  unitLabel: string;
  stockTotal: number;
  stockReserved: number;
  collectedQuantity: number;
}

export interface ArrivalStats {
  byStatus: Record<ReservationStatus, number>;
  /** Reservations not cancelled. */
  totalReservations: number;
  customers: number;
  /** Amount of the reservations not cancelled nor missed. */
  expectedRevenue: number;
  collectedRevenue: number;
  /** Share of the finished reservations (collected or missed) that were collected, 0–1; null before any. */
  collectionRate: number | null;
  averageBasket: number | null;
  items: ArrivalItemStats[];
  daily: { day: string; count: number }[];
}

export type ArrivalErrorCode =
  | "ARRIVAL_NOT_FOUND"
  | "RESERVATION_NOT_OPEN"
  | "RESERVATION_CLOSED"
  | "ALREADY_RESERVED"
  | "ITEM_NOT_FOUND"
  | "MAX_PER_CUSTOMER"
  | "OUT_OF_STOCK"
  | "RESERVATION_NOT_FOUND"
  | "INVALID_TRANSITION"
  | "STOCK_BELOW_RESERVED"
  | "ITEM_HAS_RESERVATIONS"
  | "HAS_ACTIVE_RESERVATIONS";

/** Business rule failure; the API layer turns `code` into an HTTP status and a French message. */
export class ArrivalError extends Error {
  constructor(
    public readonly code: ArrivalErrorCode,
    /** Item the error is about (stock, limit), when there is one. */
    public readonly itemId?: string
  ) {
    super(code);
    this.name = "ArrivalError";
  }
}
