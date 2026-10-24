import type { RawArrivalStats } from "./domain";
import type {
  Arrival,
  ArrivalDraft,
  ArrivalPage,
  Reservation,
  ReservationPage,
  ReservationRequestLine,
  ReservationStatus,
} from "./types";

/**
 * Domain Port: storage of the arrivals and their products.
 */
export interface IArrivalRepository {
  /** Newest first. */
  list(offset: number, limit: number): Promise<ArrivalPage>;
  /** Not closed by hand and still taking (or about to take) reservations at `now`, soonest first. */
  listVisible(now: Date, limit: number): Promise<Arrival[]>;
  /** Returns null when the arrival does not exist. */
  get(id: string): Promise<Arrival | null>;
  create(draft: ArrivalDraft, createdBy: string | null): Promise<Arrival>;
  /**
   * Replaces the arrival's fields and products: drafts with an id are updated,
   * those without are added, missing ones are removed.
   * Throws ArrivalError STOCK_BELOW_RESERVED / ITEM_HAS_RESERVATIONS when the
   * database refuses. Returns null when the arrival does not exist.
   */
  update(id: string, draft: ArrivalDraft): Promise<Arrival | null>;
  /** Sets the manual closure (kept if already set). Returns null when the arrival does not exist. */
  close(id: string): Promise<Arrival | null>;
  /** Returns false when the arrival does not exist. */
  delete(id: string): Promise<boolean>;
  countActiveReservations(arrivalId: string): Promise<number>;
  stats(arrivalId: string): Promise<RawArrivalStats>;
}

/**
 * Domain Port: customers' reservations. Stock changes are atomic in the storage
 * (locks): two concurrent reservations never take the same unit.
 */
export interface IReservationRepository {
  /** Returns the new reservation's id. Throws ArrivalError (stock, dates, limits). */
  reserve(arrivalId: string, customerId: string, lines: ReservationRequestLine[], actor: string | null): Promise<string>;
  /**
   * Moves the reservation to `status` (a cancellation puts the stock back).
   * With `customerId`, only that customer's reservation, and only while the arrival is open.
   * Throws ArrivalError RESERVATION_NOT_FOUND / INVALID_TRANSITION / RESERVATION_CLOSED.
   */
  setStatus(id: string, status: ReservationStatus, actor: string | null, customerId?: string): Promise<void>;
  get(id: string): Promise<Reservation | null>;
  /** Newest first, optionally only one status. */
  listForArrival(arrivalId: string, status: ReservationStatus | null, offset: number, limit: number): Promise<ReservationPage>;
  /** Newest first. */
  listForCustomer(customerId: string, offset: number, limit: number): Promise<ReservationPage>;
  /** Most recent reservation still waiting for pickup, or null. */
  findLatestActiveForCustomer(customerId: string): Promise<Reservation | null>;
}
