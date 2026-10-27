import { createAdminClient } from "@/lib/supabase/admin";
import { STORE_TIME_ZONE } from "@/lib/store/config";
import type { IArrivalRepository, IReservationRepository } from "../ports";
import type { RawArrivalStats } from "../domain";
import { ACTIVE_RESERVATION_STATUSES } from "../domain";
import {
  ArrivalError,
  type Arrival,
  type ArrivalCategory,
  type ArrivalDraft,
  type ArrivalErrorCode,
  type ArrivalItemDraft,
  type ArrivalPage,
  type Reservation,
  type ReservationPage,
  type ReservationRequestLine,
  type ReservationStatus,
} from "../types";

const ARRIVALS = "arrivals";
const ITEMS = "arrival_items";
const RESERVATIONS = "arrival_reservations";

const ARRIVAL_COLUMNS =
  "id, title, description, category, reservation_opens_at, reservation_closes_at, pickup_date, closed_at, created_at, " +
  "items:arrival_items(id, name, unit_label, weight_grams, unit_price, stock_total, stock_reserved, max_per_customer, position)";

const RESERVATION_COLUMNS =
  "id, arrival_id, status, total_amount, created_at, status_changed_at, " +
  "lines:arrival_reservation_lines(item_id, item_name, unit_label, unit_price, quantity), " +
  "events:arrival_reservation_events(status, created_at), " +
  "arrival:arrivals(id, title, pickup_date, reservation_closes_at, closed_at), " +
  "customer:customers(id, profile:profiles(first_name, last_name, phone_number, email))";

/** Codes raised by the SQL functions in supabase/arrivals.sql, passed through as domain errors. */
const SQL_ERROR_CODES: readonly ArrivalErrorCode[] = [
  "ARRIVAL_NOT_FOUND",
  "RESERVATION_NOT_OPEN",
  "RESERVATION_CLOSED",
  "ALREADY_RESERVED",
  "ITEM_NOT_FOUND",
  "MAX_PER_CUSTOMER",
  "OUT_OF_STOCK",
  "RESERVATION_NOT_FOUND",
  "INVALID_TRANSITION",
];

interface ArrivalItemRow {
  id: string;
  name: string;
  unit_label: string;
  weight_grams: number | null;
  unit_price: number | string;
  stock_total: number;
  stock_reserved: number;
  max_per_customer: number | null;
  position: number;
}

interface ArrivalRow {
  id: string;
  title: string;
  description: string | null;
  category: ArrivalCategory;
  reservation_opens_at: string;
  reservation_closes_at: string;
  pickup_date: string;
  closed_at: string | null;
  created_at: string;
  items: ArrivalItemRow[] | null;
}

interface ReservationRow {
  id: string;
  arrival_id: string;
  status: ReservationStatus;
  total_amount: number | string;
  created_at: string;
  status_changed_at: string;
  lines: { item_id: string; item_name: string; unit_label: string; unit_price: number | string; quantity: number }[] | null;
  events: { status: ReservationStatus; created_at: string }[] | null;
  arrival: { id: string; title: string; pickup_date: string; reservation_closes_at: string; closed_at: string | null } | null;
  customer: {
    id: string;
    profile: { first_name: string | null; last_name: string | null; phone_number: string | null; email: string | null } | null;
  } | null;
}

interface StatsJson {
  by_status: Partial<Record<ReservationStatus, number>>;
  customers: number;
  expected_revenue: number | string;
  collected_revenue: number | string;
  items: {
    item_id: string;
    name: string;
    unit_label: string;
    stock_total: number;
    stock_reserved: number;
    collected_quantity: number;
  }[];
  daily: { day: string; count: number }[];
}

function toArrival(row: ArrivalRow): Arrival {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    reservationOpensAt: row.reservation_opens_at,
    reservationClosesAt: row.reservation_closes_at,
    pickupDate: row.pickup_date,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    items: (row.items ?? [])
      .map((i) => ({
        id: i.id,
        name: i.name,
        unitLabel: i.unit_label,
        weightGrams: i.weight_grams,
        unitPrice: Number(i.unit_price),
        stockTotal: i.stock_total,
        stockReserved: i.stock_reserved,
        maxPerCustomer: i.max_per_customer,
        position: i.position,
      }))
      .sort((a, b) => a.position - b.position),
  };
}

function toReservation(row: ReservationRow): Reservation {
  const profile = row.customer?.profile;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return {
    id: row.id,
    arrivalId: row.arrival_id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    statusChangedAt: row.status_changed_at,
    history: (row.events ?? [])
      .map((e) => ({ status: e.status, at: e.created_at }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    lines: (row.lines ?? []).map((l) => ({
      itemId: l.item_id,
      itemName: l.item_name,
      unitLabel: l.unit_label,
      unitPrice: Number(l.unit_price),
      quantity: l.quantity,
    })),
    arrival: {
      id: row.arrival?.id ?? row.arrival_id,
      title: row.arrival?.title ?? "",
      pickupDate: row.arrival?.pickup_date ?? "",
      reservationClosesAt: row.arrival?.reservation_closes_at ?? "",
      closedAt: row.arrival?.closed_at ?? null,
    },
    customer: {
      id: row.customer?.id ?? "",
      fullName: fullName || profile?.email || "Client",
      phone: profile?.phone_number ?? null,
      email: profile?.email ?? null,
    },
  };
}

function itemFields(item: ArrivalItemDraft, position: number) {
  return {
    name: item.name,
    unit_label: item.unitLabel,
    weight_grams: item.weightGrams,
    unit_price: item.unitPrice,
    stock_total: item.stockTotal,
    max_per_customer: item.maxPerCustomer,
    position,
  };
}

function itemRow(arrivalId: string, item: ArrivalItemDraft, position: number) {
  return { arrival_id: arrivalId, ...itemFields(item, position) };
}

function arrivalRow(draft: ArrivalDraft) {
  return {
    title: draft.title,
    description: draft.description,
    category: draft.category,
    reservation_opens_at: draft.reservationOpensAt,
    reservation_closes_at: draft.reservationClosesAt,
    pickup_date: draft.pickupDate,
  };
}

type SupabaseError = { message: string; code?: string; details?: string | null } | null;

/** Throws a descriptive error for a failed Supabase call, so callers never mistake a failure for success. */
function check(error: SupabaseError, operation: string): void {
  if (error) {
    throw new Error(`[SupabaseArrivalRepo] ${operation} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  }
}

/** Turns a business error raised by an SQL function into an ArrivalError; anything else stays a failure. */
function checkRpc(error: SupabaseError, operation: string): void {
  if (!error) return;
  const code = SQL_ERROR_CODES.find((c) => c === error.message);
  if (code) throw new ArrivalError(code, error.details || undefined);
  check(error, operation);
}

/**
 * Infrastructure Adapter: arrivals and their products in Supabase.
 */
export class SupabaseArrivalRepository implements IArrivalRepository {
  async list(offset: number, limit: number): Promise<ArrivalPage> {
    const { data, error, count } = await createAdminClient()
      .from(ARRIVALS)
      .select(ARRIVAL_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "list");
    return { items: ((data ?? []) as unknown as ArrivalRow[]).map(toArrival), total: count ?? 0 };
  }

  async listVisible(now: Date, limit: number): Promise<Arrival[]> {
    const { data, error } = await createAdminClient()
      .from(ARRIVALS)
      .select(ARRIVAL_COLUMNS)
      .is("closed_at", null)
      .gt("reservation_closes_at", now.toISOString())
      .order("reservation_opens_at", { ascending: true })
      .limit(limit);
    check(error, "listVisible");
    return ((data ?? []) as unknown as ArrivalRow[]).map(toArrival);
  }

  async get(id: string): Promise<Arrival | null> {
    const { data, error } = await createAdminClient().from(ARRIVALS).select(ARRIVAL_COLUMNS).eq("id", id).maybeSingle();
    check(error, "get");
    return data ? toArrival(data as unknown as ArrivalRow) : null;
  }

  async create(draft: ArrivalDraft, createdBy: string | null): Promise<Arrival> {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from(ARRIVALS)
      .insert({ ...arrivalRow(draft), created_by: createdBy })
      .select("id")
      .single();
    check(error, "create");
    const id = (data as { id: string }).id;

    const { error: itemsError } = await sb.from(ITEMS).insert(draft.items.map((item, i) => itemRow(id, item, i)));
    if (itemsError) {
      // No transaction across PostgREST calls: drop the arrival rather than leave it without products
      await sb.from(ARRIVALS).delete().eq("id", id);
      check(itemsError, "create items");
    }
    return (await this.get(id)) as Arrival;
  }

  async update(id: string, draft: ArrivalDraft): Promise<Arrival | null> {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from(ARRIVALS)
      .update({ ...arrivalRow(draft), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    check(error, "update");
    if (!data) return null;

    const { data: existing, error: existingError } = await sb.from(ITEMS).select("id").eq("arrival_id", id).limit(1000);
    check(existingError, "update read items");
    const keptIds = new Set(draft.items.map((i) => i.id).filter(Boolean));
    const removed = (existing ?? []).map((r) => (r as { id: string }).id).filter((itemId) => !keptIds.has(itemId));

    if (removed.length > 0) {
      const { error: deleteError } = await sb.from(ITEMS).delete().eq("arrival_id", id).in("id", removed);
      // 23503: a reservation line still points at the product
      if (deleteError?.code === "23503") throw new ArrivalError("ITEM_HAS_RESERVATIONS");
      check(deleteError, "update remove items");
    }

    for (const [position, item] of draft.items.entries()) {
      if (item.id) {
        const { error: itemError } = await sb.from(ITEMS).update(itemFields(item, position)).eq("id", item.id).eq("arrival_id", id);
        // 23514: stock_reserved <= stock_total refused the new stock
        if (itemError?.code === "23514") throw new ArrivalError("STOCK_BELOW_RESERVED", item.id);
        check(itemError, "update item");
      } else {
        const { error: insertError } = await sb.from(ITEMS).insert(itemRow(id, item, position));
        check(insertError, "update add item");
      }
    }
    return this.get(id);
  }

  async close(id: string): Promise<Arrival | null> {
    const sb = createAdminClient();
    const { error } = await sb.from(ARRIVALS).update({ closed_at: new Date().toISOString() }).eq("id", id).is("closed_at", null);
    check(error, "close");
    return this.get(id);
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await createAdminClient().from(ARRIVALS).delete().eq("id", id).select("id");
    check(error, "delete");
    return (data ?? []).length > 0;
  }

  async countActiveReservations(arrivalId: string): Promise<number> {
    const { count, error } = await createAdminClient()
      .from(RESERVATIONS)
      .select("id", { count: "exact", head: true })
      .eq("arrival_id", arrivalId)
      .in("status", [...ACTIVE_RESERVATION_STATUSES]);
    check(error, "countActiveReservations");
    return count ?? 0;
  }

  async stats(arrivalId: string): Promise<RawArrivalStats> {
    const { data, error } = await createAdminClient().rpc("arrival_stats", {
      p_arrival_id: arrivalId,
      p_tz: STORE_TIME_ZONE,
    });
    check(error, "stats");
    const json = data as StatsJson;
    return {
      byStatus: json.by_status ?? {},
      customers: Number(json.customers ?? 0),
      expectedRevenue: Number(json.expected_revenue ?? 0),
      collectedRevenue: Number(json.collected_revenue ?? 0),
      items: (json.items ?? []).map((i) => ({
        itemId: i.item_id,
        name: i.name,
        unitLabel: i.unit_label,
        stockTotal: i.stock_total,
        stockReserved: i.stock_reserved,
        collectedQuantity: Number(i.collected_quantity),
      })),
      daily: (json.daily ?? []).map((d) => ({ day: d.day, count: Number(d.count) })),
    };
  }
}

/**
 * Infrastructure Adapter: reservations in Supabase. Stock changes go through
 * the SQL functions of supabase/arrivals.sql, which lock the products.
 */
export class SupabaseReservationRepository implements IReservationRepository {
  async reserve(
    arrivalId: string,
    customerId: string,
    lines: ReservationRequestLine[],
    actor: string | null
  ): Promise<string> {
    const { data, error } = await createAdminClient().rpc("arrival_reserve", {
      p_arrival_id: arrivalId,
      p_customer_id: customerId,
      p_lines: lines.map((l) => ({ item_id: l.itemId, quantity: l.quantity })),
      p_actor: actor,
    });
    checkRpc(error, "reserve");
    return data as string;
  }

  async setStatus(id: string, status: ReservationStatus, actor: string | null, customerId?: string): Promise<void> {
    const { error } = await createAdminClient().rpc("arrival_reservation_set_status", {
      p_reservation_id: id,
      p_status: status,
      p_actor: actor,
      p_customer_id: customerId ?? null,
    });
    checkRpc(error, "setStatus");
  }

  async get(id: string): Promise<Reservation | null> {
    const { data, error } = await createAdminClient()
      .from(RESERVATIONS)
      .select(RESERVATION_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    check(error, "get");
    return data ? toReservation(data as unknown as ReservationRow) : null;
  }

  async listForArrival(
    arrivalId: string,
    status: ReservationStatus | null,
    offset: number,
    limit: number
  ): Promise<ReservationPage> {
    let query = createAdminClient()
      .from(RESERVATIONS)
      .select(RESERVATION_COLUMNS, { count: "exact" })
      .eq("arrival_id", arrivalId);
    if (status) query = query.eq("status", status);
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "listForArrival");
    return { items: ((data ?? []) as unknown as ReservationRow[]).map(toReservation), total: count ?? 0 };
  }

  async listForCustomer(customerId: string, offset: number, limit: number): Promise<ReservationPage> {
    const { data, error, count } = await createAdminClient()
      .from(RESERVATIONS)
      .select(RESERVATION_COLUMNS, { count: "exact" })
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "listForCustomer");
    return { items: ((data ?? []) as unknown as ReservationRow[]).map(toReservation), total: count ?? 0 };
  }

  async findLatestActiveForCustomer(customerId: string): Promise<Reservation | null> {
    const { data, error } = await createAdminClient()
      .from(RESERVATIONS)
      .select(RESERVATION_COLUMNS)
      .eq("customer_id", customerId)
      .in("status", [...ACTIVE_RESERVATION_STATUSES])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    check(error, "findLatestActiveForCustomer");
    return data ? toReservation(data as unknown as ReservationRow) : null;
  }
}
