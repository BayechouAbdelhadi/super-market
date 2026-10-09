export type UserRole = "ADMIN" | "CASHIER" | "CUSTOMER";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  created_at: string;
}

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "VIP";

export interface CustomerSummary {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  phone_normalized: string;
  tier: LoyaltyTier;
  historical_points: number; // All earned points
  available_points: number;  // Current balance
}

export interface Transaction {
  id: string;
  customer_id: string;
  cashier_id: string | null;
  amount_total: number;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
}

export interface PurchaseRecord {
  id: string;
  amount: number;
  points_earned: number;
  points_redeemed?: number;
  transaction_date: string;
  created_by: string;
}

export interface MovementRecord {
  id: string;
  type: "EARN" | "REDEEM" | string;
  amount?: number;
  points?: number;
  balance_after?: number;
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface CreateCustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ProfileWithCustomerRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  created_at?: string;
  role?: UserRole | null;
  customers?: { loyalty_points: number; status: string; updated_at?: string } | Array<{ loyalty_points: number; status: string; updated_at?: string }> | null;
}

export interface CustomerDetail extends CustomerSummary {
  created_at: string;
  updated_at: string;
  transactions: Transaction[];
  purchases: PurchaseRecord[];
  movements: MovementRecord[];
}
