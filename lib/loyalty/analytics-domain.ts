import {
  DailySalesRecord,
  LiveOperationRecord,
} from "./analytics-types";
import { LoyaltyTier } from "./types";
import type { DailySalesTotals } from "./ports";

/**
 * Formats a currency amount in French format (e.g. "12 450,50")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Formats an integer with space thousands separator (e.g. "1 450")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(num || 0));
}

/**
 * Returns beginning of today (00:00:00.000)
 */
export function getStartOfToday(referenceDate: Date = new Date()): Date {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Local calendar date (YYYY-MM-DD) of a Date, in the server's timezone. */
export function toLocalDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Start (local midnight) of the first day of an N-day window ending today. */
export function getTrendWindowStart(daysCount: number, now: Date = new Date()): Date {
  const start = getStartOfToday(now);
  start.setDate(start.getDate() - (daysCount - 1));
  return start;
}

/**
 * Lays database-aggregated day totals onto the last N days (days without sales = 0).
 */
export function buildDailySalesTrend(
  dayTotals: DailySalesTotals[],
  daysCount = 7,
  now: Date = new Date()
): DailySalesRecord[] {
  const totalsByDate = new Map(dayTotals.map((t) => [t.date, t]));
  const result: DailySalesRecord[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = getStartOfToday(now);
    d.setDate(d.getDate() - i);

    const dateKey = toLocalDateKey(d);
    const rawLabel = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
    });
    const totals = totalsByDate.get(dateKey);

    result.push({
      date: dateKey,
      label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
      revenue: Math.round((totals?.revenue ?? 0) * 100) / 100,
      salesCount: totals?.salesCount ?? 0,
      pointsEarned: totals?.pointsEarned ?? 0,
      pointsRedeemed: totals?.pointsRedeemed ?? 0,
    });
  }

  return result;
}

/**
 * Builds live operations list strictly from Supabase transactions and profiles
 */
export function buildLiveOperations(
  rawTransactions: Array<{
    id: string;
    customer_id?: string | null;
    cashier_id?: string | null;
    amount_total: number;
    points_earned: number;
    points_redeemed: number;
    created_at: string;
  }>,
  profilesById: Map<
    string,
    { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null }
  >,
  customersById: Map<string, { loyalty_points: number; status: string }>,
  limit = 15
): LiveOperationRecord[] {
  return rawTransactions.slice(0, limit).map((t) => {
    const custProfile = t.customer_id ? profilesById.get(t.customer_id) : null;
    const cashierProfile = t.cashier_id ? profilesById.get(t.cashier_id) : null;
    const custData = t.customer_id ? customersById.get(t.customer_id) : null;

    const customerName = custProfile
      ? `${custProfile.first_name || ""} ${custProfile.last_name || ""}`.trim() ||
        custProfile.email ||
        "Client"
      : "Client";

    const cashierName = cashierProfile
      ? `${cashierProfile.first_name || ""} ${cashierProfile.last_name || ""}`.trim() ||
        cashierProfile.email ||
        "Caisse"
      : "Caisse";

    const isRedeem = (t.points_redeemed || 0) > 0;
    const tier = (custData?.status as LoyaltyTier | undefined) || "BRONZE";

    const txDate = new Date(t.created_at);
    const formattedTime = txDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: t.id,
      type: isRedeem ? "REDEEM" : "PURCHASE",
      customerName,
      customerEmail: custProfile?.email || undefined,
      customerTier: tier,
      cashierName,
      amount: Number(t.amount_total) || 0,
      pointsEarned: Number(t.points_earned) || 0,
      pointsRedeemed: Number(t.points_redeemed) || 0,
      createdAt: t.created_at,
      formattedTime,
    };
  });
}
