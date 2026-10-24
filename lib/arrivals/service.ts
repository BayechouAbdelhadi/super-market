import type { IArrivalRepository, IReservationRepository } from "./ports";
import {
  ArrivalError,
  type Arrival,
  type ArrivalPage,
  type ArrivalStats,
  type Reservation,
  type ReservationPage,
  type ReservationStatus,
  type StaffReservationStatus,
} from "./types";
import type { ArrivalInput, CreateReservationInput } from "./validation";
import { ARRIVALS_CONFIG } from "./config";
import {
  assertItemChangesAllowed,
  buildArrivalStats,
  canTransition,
  getArrivalPhase,
  isVisibleOnSite,
  maxReservable,
} from "./domain";
import { SupabaseArrivalRepository, SupabaseReservationRepository } from "./adapters/supabase-arrival-repository";

const defaultArrivals: IArrivalRepository = new SupabaseArrivalRepository();
const defaultReservations: IReservationRepository = new SupabaseReservationRepository();

// ── Admin ─────────────────────────────────────────────────────────────

export function listArrivals(
  offset: number,
  limit: number,
  repo: IArrivalRepository = defaultArrivals
): Promise<ArrivalPage> {
  return repo.list(offset, limit);
}

export function getArrival(id: string, repo: IArrivalRepository = defaultArrivals): Promise<Arrival | null> {
  return repo.get(id);
}

export async function getArrivalStats(id: string, repo: IArrivalRepository = defaultArrivals): Promise<ArrivalStats> {
  return buildArrivalStats(await repo.stats(id));
}

export function createArrival(
  input: ArrivalInput,
  createdBy: string | null,
  repo: IArrivalRepository = defaultArrivals
): Promise<Arrival> {
  return repo.create(input, createdBy);
}

/** Null when the arrival does not exist. Throws ArrivalError when the edit conflicts with reservations. */
export async function updateArrival(
  id: string,
  input: ArrivalInput,
  repo: IArrivalRepository = defaultArrivals
): Promise<Arrival | null> {
  const current = await repo.get(id);
  if (!current) return null;
  assertItemChangesAllowed(current, input);
  return repo.update(id, input);
}

export function closeArrival(id: string, repo: IArrivalRepository = defaultArrivals): Promise<Arrival | null> {
  return repo.close(id);
}

/** False when the arrival does not exist. Throws HAS_ACTIVE_RESERVATIONS while customers still wait for it. */
export async function deleteArrival(id: string, repo: IArrivalRepository = defaultArrivals): Promise<boolean> {
  if ((await repo.countActiveReservations(id)) > 0) throw new ArrivalError("HAS_ACTIVE_RESERVATIONS");
  return repo.delete(id);
}

export function listArrivalReservations(
  arrivalId: string,
  status: ReservationStatus | null,
  offset: number,
  limit: number,
  repo: IReservationRepository = defaultReservations
): Promise<ReservationPage> {
  return repo.listForArrival(arrivalId, status, offset, limit);
}

// ── Public site ───────────────────────────────────────────────────────

/**
 * Arrivals to show on the home page. Never throws: a storage failure
 * must not take the site down, it only hides the section.
 */
export async function getVisibleArrivals(now: Date, repo: IArrivalRepository = defaultArrivals): Promise<Arrival[]> {
  try {
    const arrivals = await repo.listVisible(now, ARRIVALS_CONFIG.homeMaxCount);
    return arrivals.filter((a) => isVisibleOnSite(a, now));
  } catch (err) {
    console.error("[Arrivals] Failed to load visible arrivals:", err);
    return [];
  }
}

// ── Customer ──────────────────────────────────────────────────────────

/**
 * Reserves for a customer. Checks the dates and quantities first for a clear
 * error; the storage then takes the stock atomically, which settles races.
 */
export async function reserve(
  arrivalId: string,
  customerId: string,
  input: CreateReservationInput,
  actor: string | null,
  arrivals: IArrivalRepository = defaultArrivals,
  reservations: IReservationRepository = defaultReservations
): Promise<Reservation> {
  const arrival = await arrivals.get(arrivalId);
  if (!arrival) throw new ArrivalError("ARRIVAL_NOT_FOUND");

  const phase = getArrivalPhase(arrival, new Date());
  if (phase === "SCHEDULED") throw new ArrivalError("RESERVATION_NOT_OPEN");
  if (phase !== "OPEN") throw new ArrivalError("RESERVATION_CLOSED");

  for (const line of input.lines) {
    const item = arrival.items.find((i) => i.id === line.itemId);
    if (!item) throw new ArrivalError("ITEM_NOT_FOUND", line.itemId);
    if (item.maxPerCustomer !== null && line.quantity > item.maxPerCustomer) {
      throw new ArrivalError("MAX_PER_CUSTOMER", item.id);
    }
    if (line.quantity > maxReservable(item, ARRIVALS_CONFIG.maxQuantityPerLine)) {
      throw new ArrivalError("OUT_OF_STOCK", item.id);
    }
  }

  const id = await reservations.reserve(arrivalId, customerId, input.lines, actor);
  const created = await reservations.get(id);
  if (!created) throw new ArrivalError("RESERVATION_NOT_FOUND");
  return created;
}

export function listCustomerReservations(
  customerId: string,
  offset: number,
  limit: number,
  repo: IReservationRepository = defaultReservations
): Promise<ReservationPage> {
  return repo.listForCustomer(customerId, offset, limit);
}

/** The customer cancels their own reservation; the stock goes back on sale. */
export function cancelOwnReservation(
  id: string,
  customerId: string,
  actor: string | null,
  repo: IReservationRepository = defaultReservations
): Promise<void> {
  return repo.setStatus(id, "CANCELLED", actor, customerId);
}

// ── Checkout (cashier, admin) ─────────────────────────────────────────

export function getActiveReservationForCustomer(
  customerId: string,
  repo: IReservationRepository = defaultReservations
): Promise<Reservation | null> {
  return repo.findLatestActiveForCustomer(customerId);
}

/** Collected, reminded, missed or cancelled by staff. Returns the updated reservation. */
export async function setReservationStatus(
  id: string,
  status: StaffReservationStatus,
  actor: string | null,
  repo: IReservationRepository = defaultReservations
): Promise<Reservation> {
  const current = await repo.get(id);
  if (!current) throw new ArrivalError("RESERVATION_NOT_FOUND");
  if (!canTransition(current.status, status)) throw new ArrivalError("INVALID_TRANSITION");
  await repo.setStatus(id, status, actor);
  return { ...current, status, statusChangedAt: new Date().toISOString() };
}
