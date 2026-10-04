export type UserRole = "CASHIER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_normalized: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Purchase {
  id: string;
  customer_id: string;
  amount: number;
  points_earned: number;
  transaction_date: string;
  created_at: string;
  created_by: string;
}

export type PointMovementType = "EARN" | "REDEEM" | "ADJUSTMENT";

export interface PointMovement {
  id: string;
  customer_id: string;
  type: PointMovementType;
  amount: number;
  purchase_id: string | null;
  reason: string | null;
  created_at: string;
  created_by: string;
}

export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "VIP";

export interface CustomerSummary {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  phone_normalized: string;
  tier: LoyaltyTier;
  historical_points: number;
  available_points: number;
}

export interface CustomerDetail extends CustomerSummary {
  created_at: string;
  updated_at: string;
  purchases: Purchase[];
  movements: PointMovement[];
}
