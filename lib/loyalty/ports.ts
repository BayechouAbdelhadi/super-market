import {
  CustomerDetail,
  CustomerSummary,
  DirectoryUser,
  LoyaltyTier,
  Transaction,
  CreateCustomerInput,
  ProfileWithCustomerRow,
  UserRole,
} from "./types";

/**
 * Domain Port (Interface) for Customer persistence.
 * Agnostic of any database, ORM, or cloud provider (Hexagonal Architecture).
 */
export interface Page<T> {
  items: T[];
  total: number;
}

export interface ICustomerRepository {
  search(query: string, limit?: number): Promise<CustomerSummary[]>;
  /** Database-side pagination: `total` is the exact number of matches. */
  searchPage(query: string, limit: number, offset: number): Promise<Page<CustomerSummary>>;
  getById(id: string, transactionsLimit?: number): Promise<CustomerDetail | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  findByPhone(phone: string): Promise<{ id: string } | null>;
  createAuthAndProfile(data: CreateCustomerInput): Promise<{ id: string; email: string }>;
  updateLoyaltyPoints(id: string, availablePoints: number, tier?: LoyaltyTier): Promise<void>;
}

/**
 * Domain Port (Interface) for Transaction persistence.
 * Agnostic of any database, ORM, or cloud provider (Hexagonal Architecture).
 */
export interface ITransactionRepository {
  create(data: {
    customerId: string;
    cashierId: string | null;
    amount: number;
    pointsEarned: number;
    pointsRedeemed: number;
  }): Promise<Transaction>;
  getById(id: string): Promise<Transaction | null>;
  /** Corrects a recorded transaction and stamps who edited it. */
  update(
    id: string,
    data: { amount: number; pointsEarned: number; pointsRedeemed: number; editedBy: string }
  ): Promise<Transaction>;
  getByCustomerId(customerId: string, limit?: number): Promise<Transaction[]>;
  /** Database-side pagination (newest first): `total` is the exact count. */
  getPageByCustomerId(customerId: string, limit: number, offset: number): Promise<Page<Transaction>>;
}

export interface AnalyticsTransactionRow {
  id: string;
  customer_id: string | null;
  cashier_id: string | null;
  amount_total: number;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
}

export interface AnalyticsProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

export interface AnalyticsCustomerRow {
  id: string;
  loyalty_points: number;
  status: string;
}

/** Transaction sums computed by the database: today (from a local midnight) and all time. */
export interface TransactionTotals {
  revenueToday: number;
  salesToday: number;
  pointsEarnedToday: number;
  pointsRedeemedToday: number;
  revenueTotal: number;
  salesTotal: number;
  pointsEarnedTotal: number;
  pointsRedeemedTotal: number;
}

/** Database-aggregated totals for one local calendar day. */
export interface DailySalesTotals {
  date: string; // "YYYY-MM-DD"
  revenue: number;
  salesCount: number;
  pointsEarned: number;
  pointsRedeemed: number;
}

/**
 * Domain Port (Interface) for analytics reads. All methods are bounded
 * (date window, limit or exact database-side count).
 */
export interface IAnalyticsRepository {
  /** Transactions (newest first), optionally from `since`, at most `limit` rows. */
  getRecentTransactions(options: { since?: Date; limit: number }): Promise<AnalyticsTransactionRow[]>;
  /** Today's and all-time transaction sums, aggregated by the database. */
  getTransactionTotals(todayStart: Date): Promise<TransactionTotals>;
  /** Per-day sums (days in `timeZone`) of transactions since `since`, aggregated by the database. */
  getDailySales(since: Date, timeZone: string): Promise<DailySalesTotals[]>;
  /** Exact database-side count of profiles with a role, optionally created from `since`. */
  countProfiles(role: string, since?: Date): Promise<number | null>;
  /** Profiles and loyalty records of the given users (for the live feed). */
  getUsersByIds(ids: string[]): Promise<{ profiles: AnalyticsProfileRow[]; customers: AnalyticsCustomerRow[] }>;
}

/**
 * Domain Port (Interface) for back-office lists of accounts (RLS-scoped to the caller).
 */
export interface IDirectoryRepository {
  /** Most recently created customers with their loyalty record. */
  listRecentCustomers(limit: number): Promise<ProfileWithCustomerRow[]>;
  /** Most recently created profiles with the given role. */
  listRecentProfilesByRole(role: UserRole, limit: number): Promise<DirectoryUser[]>;
}
