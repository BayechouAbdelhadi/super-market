import {
  DashboardKpis,
  DailySalesRecord,
  LiveOperationRecord,
  RealDashboardData,
} from "./analytics-types";

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

/**
 * Pure calculation of KPIs strictly from Supabase records (zero fake data)
 */
export function calculateRealKpis(
  rawTransactions: Array<{
    id: string;
    amount_total: number;
    points_earned: number;
    points_redeemed: number;
    created_at: string;
  }>,
  rawProfiles: Array<{
    id: string;
    role?: string | null;
    created_at: string;
  }>,
  now: Date = new Date()
): DashboardKpis {
  const todayStart = getStartOfToday(now);

  let caToday = 0;
  let caTotal = 0;
  let dailySalesCount = 0;
  let dailyPointsRedeemed = 0;
  let totalPointsRedeemed = 0;
  let dailyPointsEarned = 0;
  let totalPointsEarned = 0;

  for (const t of rawTransactions) {
    const amount = Number(t.amount_total) || 0;
    const earned = Number(t.points_earned) || 0;
    const redeemed = Number(t.points_redeemed) || 0;
    const txDate = new Date(t.created_at);

    caTotal += amount;
    totalPointsEarned += earned;
    totalPointsRedeemed += redeemed;

    if (txDate >= todayStart) {
      caToday += amount;
      dailySalesCount += 1;
      dailyPointsRedeemed += redeemed;
      dailyPointsEarned += earned;
    }
  }

  // Clients stats from profiles table
  const customerProfiles = rawProfiles.filter(
    (p) => !p.role || p.role === "CUSTOMER"
  );
  const totalClients = customerProfiles.length;
  const newClientsToday = customerProfiles.filter((p) => {
    const createdAt = new Date(p.created_at);
    return createdAt >= todayStart;
  }).length;

  return {
    caToday: Math.round(caToday * 100) / 100,
    caTotal: Math.round(caTotal * 100) / 100,
    dailySalesCount,
    totalSalesCount: rawTransactions.length,
    dailyPointsRedeemed,
    totalPointsRedeemed,
    dailyPointsEarned,
    totalPointsEarned,
    newClientsToday,
    totalClients,
  };
}

/**
 * Aggregates real sales by day over the last N days (defaults to 7 days)
 */
export function aggregateDailySales(
  rawTransactions: Array<{
    amount_total: number;
    points_earned: number;
    points_redeemed: number;
    created_at: string;
  }>,
  daysCount = 7,
  now: Date = new Date()
): DailySalesRecord[] {
  const result: DailySalesRecord[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const dateKey = d.toISOString().split("T")[0];
    const rawLabel = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
    });
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

    // Filter real transactions matching this day
    const dayTxs = rawTransactions.filter((t) => {
      const txTime = new Date(t.created_at);
      return txTime >= d && txTime < nextDay;
    });

    const dayRevenue = dayTxs.reduce(
      (sum, t) => sum + (Number(t.amount_total) || 0),
      0
    );
    const dayPointsEarned = dayTxs.reduce(
      (sum, t) => sum + (Number(t.points_earned) || 0),
      0
    );
    const dayPointsRedeemed = dayTxs.reduce(
      (sum, t) => sum + (Number(t.points_redeemed) || 0),
      0
    );

    result.push({
      date: dateKey,
      label,
      revenue: Math.round(dayRevenue * 100) / 100,
      salesCount: dayTxs.length,
      pointsEarned: dayPointsEarned,
      pointsRedeemed: dayPointsRedeemed,
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

    const isRedeem = (t.points_redeemed || 0) > 0 && (Number(t.amount_total) || 0) === 0;
    const tier = (custData?.status as any) || "BRONZE";

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
