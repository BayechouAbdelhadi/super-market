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

export interface CustomerDetail extends CustomerSummary {
  created_at: string;
  updated_at: string;
  transactions: Transaction[];
}
