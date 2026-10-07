export interface DashboardKpis {
  caToday: number;
  caTotal: number;
  dailySalesCount: number;
  totalSalesCount: number;
  dailyPointsRedeemed: number;
  totalPointsRedeemed: number;
  dailyPointsEarned: number;
  totalPointsEarned: number;
  newClientsToday: number;
  totalClients: number;
}

export interface DailySalesRecord {
  date: string; // "YYYY-MM-DD"
  label: string; // "Lun 07"
  revenue: number;
  salesCount: number;
  pointsEarned: number;
  pointsRedeemed: number;
}

export interface LiveOperationRecord {
  id: string;
  type: "PURCHASE" | "REDEEM";
  customerName: string;
  customerEmail?: string;
  customerTier: "BRONZE" | "SILVER" | "GOLD" | "VIP";
  cashierName: string;
  amount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  createdAt: string;
  formattedTime: string;
}

export interface RealDashboardData {
  generatedAt: string;
  kpis: DashboardKpis;
  dailySalesTrend: DailySalesRecord[];
  liveOperations: LiveOperationRecord[];
  totalCashiersCount: number;
}
