import { STORE_TIME_ZONE } from "@/lib/store/config";
import { ARRIVALS_CONFIG } from "./config";
import {
  ArrivalError,
  RESERVATION_STATUSES,
  type Arrival,
  type ArrivalDraft,
  type ArrivalItem,
  type ArrivalPhase,
  type ArrivalStats,
  type ReservationLine,
  type ReservationStatus,
} from "./types";

/** Reservations still waiting for the customer to come. */
export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = ["CONFIRMED", "REMINDED"];

/** Allowed moves; mirrored by `arrival_reservation_set_status` in supabase/arrivals.sql. */
const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  CONFIRMED: ["REMINDED", "COLLECTED", "CANCELLED", "NO_SHOW"],
  REMINDED: ["COLLECTED", "CANCELLED", "NO_SHOW"],
  COLLECTED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isActiveReservation(status: ReservationStatus): boolean {
  return ACTIVE_RESERVATION_STATUSES.includes(status);
}

/** "YYYY-MM-DD" of `date` in the store's time zone. */
export function storeDay(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type ArrivalDates = Pick<Arrival, "reservationOpensAt" | "reservationClosesAt" | "pickupDate" | "closedAt">;

export function getArrivalPhase(arrival: ArrivalDates, now: Date): ArrivalPhase {
  if (storeDay(now) > arrival.pickupDate) return "FINISHED";
  if (arrival.closedAt || now >= new Date(arrival.reservationClosesAt)) return "CLOSED";
  if (now < new Date(arrival.reservationOpensAt)) return "SCHEDULED";
  return "OPEN";
}

/** Shown on the public site until reservations close (open or about to open). */
export function isVisibleOnSite(arrival: ArrivalDates, now: Date): boolean {
  const phase = getArrivalPhase(arrival, now);
  return phase === "SCHEDULED" || phase === "OPEN";
}

const weightFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Sales unit with its weight: "barquette de 500 g", "barquette de 1,5 kg". */
export function unitLabelFor(weightGrams: number): string {
  const weight =
    weightGrams >= 1000 ? `${weightFormatter.format(weightGrams / 1000)} kg` : `${weightFormatter.format(weightGrams)} g`;
  return `${ARRIVALS_CONFIG.unitLabel} de ${weight}`;
}

export function remainingStock(item: Pick<ArrivalItem, "stockTotal" | "stockReserved">): number {
  return Math.max(0, item.stockTotal - item.stockReserved);
}

/** Most units of `item` a customer can still add: stock left, capped by the per-customer limit. */
export function maxReservable(item: ArrivalItem, perLineCap: number): number {
  const limit = item.maxPerCustomer ?? Infinity;
  return Math.max(0, Math.min(remainingStock(item), limit, perLineCap));
}

/** Rounded to the cent, like the NUMERIC(10, 2) column. */
export function reservationTotal(lines: Pick<ReservationLine, "unitPrice" | "quantity">[]): number {
  const cents = lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity, 0);
  return cents / 100;
}

/**
 * A customer cancels their own reservation until reservations close
 * (same rule as `arrival_reservation_set_status`).
 */
export function canCustomerCancel(
  status: ReservationStatus,
  arrival: Pick<Arrival, "reservationClosesAt" | "closedAt">,
  now: Date
): boolean {
  return isActiveReservation(status) && !arrival.closedAt && now < new Date(arrival.reservationClosesAt);
}

/**
 * Checks an edit against the reservations already taken: a reserved product
 * cannot be removed, and its stock cannot go below what is reserved.
 * Throws an ArrivalError; the database constraints back this up.
 */
export function assertItemChangesAllowed(current: Arrival, draft: ArrivalDraft): void {
  const kept = new Map(draft.items.filter((i) => i.id).map((i) => [i.id as string, i]));
  for (const item of current.items) {
    const next = kept.get(item.id);
    if (!next) {
      if (item.stockReserved > 0) throw new ArrivalError("ITEM_HAS_RESERVATIONS", item.id);
      continue;
    }
    if (next.stockTotal < item.stockReserved) throw new ArrivalError("STOCK_BELOW_RESERVED", item.id);
  }
  for (const id of kept.keys()) {
    if (!current.items.some((i) => i.id === id)) throw new ArrivalError("ITEM_NOT_FOUND", id);
  }
}

export interface RawArrivalStats {
  byStatus: Partial<Record<ReservationStatus, number>>;
  customers: number;
  expectedRevenue: number;
  collectedRevenue: number;
  items: ArrivalStats["items"];
  daily: ArrivalStats["daily"];
}

/** Adds the derived figures (rates, averages) to the counts computed in SQL. */
export function buildArrivalStats(raw: RawArrivalStats): ArrivalStats {
  const byStatus = Object.fromEntries(RESERVATION_STATUSES.map((s) => [s, raw.byStatus[s] ?? 0])) as Record<
    ReservationStatus,
    number
  >;
  const totalReservations = RESERVATION_STATUSES.filter((s) => s !== "CANCELLED").reduce(
    (sum, s) => sum + byStatus[s],
    0
  );
  const finished = byStatus.COLLECTED + byStatus.NO_SHOW;
  const billable = totalReservations - byStatus.NO_SHOW;
  return {
    byStatus,
    totalReservations,
    customers: raw.customers,
    expectedRevenue: raw.expectedRevenue,
    collectedRevenue: raw.collectedRevenue,
    collectionRate: finished > 0 ? byStatus.COLLECTED / finished : null,
    averageBasket: billable > 0 ? Math.round((raw.expectedRevenue / billable) * 100) / 100 : null,
    items: raw.items,
    daily: raw.daily,
  };
}
