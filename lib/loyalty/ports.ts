import {
  CustomerDetail,
  CustomerSummary,
  LoyaltyTier,
  Transaction,
  CreateCustomerInput,
} from "./types";

/**
 * Domain Port (Interface) for Customer persistence.
 * Agnostic of any database, ORM, or cloud provider (Hexagonal Architecture).
 */
export interface ICustomerRepository {
  search(query: string, limit?: number): Promise<CustomerSummary[]>;
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
  getByCustomerId(customerId: string, limit?: number): Promise<Transaction[]>;
}
