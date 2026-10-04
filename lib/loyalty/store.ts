import { Customer, PointMovement, Purchase, User } from "./types";

export interface LoyaltyDataStore {
  cashier: User;
  customers: Customer[];
  purchases: Purchase[];
  movements: PointMovement[];
}

function getInitialState(): LoyaltyDataStore {
  const cashier: User = {
    id: "cashier-1",
    name: "Marc Dupont",
    email: "marc.dupont@supermarket.fr",
    role: "CASHIER",
    created_at: "2026-01-01T08:00:00.000Z",
  };

  const customer1: Customer = {
    id: "cust-1",
    first_name: "Ahmed",
    last_name: "Bayechou",
    email: "ahmed@gmail.com",
    phone: "06 12 34 56 78",
    phone_normalized: "0612345678",
    created_at: "2026-02-10T10:15:00.000Z",
    updated_at: "2026-02-10T10:15:00.000Z",
  };

  const customer2: Customer = {
    id: "cust-2",
    first_name: "Ahmed",
    last_name: "Benali",
    email: "ahmed.benali@gmail.com",
    phone: "06 98 76 54 32",
    phone_normalized: "0698765432",
    created_at: "2026-03-05T14:30:00.000Z",
    updated_at: "2026-03-05T14:30:00.000Z",
  };

  // Ahmed Bayechou: 2450 historical points, 750 available points (1700 redeemed)
  const purchasesCust1: Purchase[] = [
    {
      id: "purch-1",
      customer_id: "cust-1",
      amount: 1500.0,
      points_earned: 1500,
      transaction_date: "2026-08-15T11:20:00.000Z",
      created_at: "2026-08-15T11:20:00.000Z",
      created_by: "cashier-1",
    },
    {
      id: "purch-2",
      customer_id: "cust-1",
      amount: 950.0,
      points_earned: 950,
      transaction_date: "2026-09-20T16:45:00.000Z",
      created_at: "2026-09-20T16:45:00.000Z",
      created_by: "cashier-1",
    },
  ];

  const movementsCust1: PointMovement[] = [
    {
      id: "mov-1",
      customer_id: "cust-1",
      type: "EARN",
      amount: 1500,
      purchase_id: "purch-1",
      reason: "Achat magasin",
      created_at: "2026-08-15T11:20:00.000Z",
      created_by: "cashier-1",
    },
    {
      id: "mov-2",
      customer_id: "cust-1",
      type: "EARN",
      amount: 950,
      purchase_id: "purch-2",
      reason: "Achat magasin",
      created_at: "2026-09-20T16:45:00.000Z",
      created_by: "cashier-1",
    },
    {
      id: "mov-3",
      customer_id: "cust-1",
      type: "REDEEM",
      amount: 1700,
      purchase_id: null,
      reason: "Remise en caisse",
      created_at: "2026-09-25T18:00:00.000Z",
      created_by: "cashier-1",
    },
  ];

  // Ahmed Benali: 850 historical points, 500 available points (350 redeemed)
  const purchasesCust2: Purchase[] = [
    {
      id: "purch-3",
      customer_id: "cust-2",
      amount: 850.5,
      points_earned: 850,
      transaction_date: "2026-09-10T12:00:00.000Z",
      created_at: "2026-09-10T12:00:00.000Z",
      created_by: "cashier-1",
    },
  ];

  const movementsCust2: PointMovement[] = [
    {
      id: "mov-4",
      customer_id: "cust-2",
      type: "EARN",
      amount: 850,
      purchase_id: "purch-3",
      reason: "Achat magasin",
      created_at: "2026-09-10T12:00:00.000Z",
      created_by: "cashier-1",
    },
    {
      id: "mov-5",
      customer_id: "cust-2",
      type: "REDEEM",
      amount: 350,
      purchase_id: null,
      reason: "Remise fidélité",
      created_at: "2026-09-18T10:30:00.000Z",
      created_by: "cashier-1",
    },
  ];

  return {
    cashier,
    customers: [customer1, customer2],
    purchases: [...purchasesCust1, ...purchasesCust2],
    movements: [...movementsCust1, ...movementsCust2],
  };
}

class InMemoryLoyaltyStore {
  private data: LoyaltyDataStore;

  constructor() {
    this.data = getInitialState();
  }

  public reset(): void {
    this.data = getInitialState();
  }

  public getCashier(): User {
    return this.data.cashier;
  }

  public getCustomers(): Customer[] {
    return [...this.data.customers];
  }

  public findCustomerById(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  public findCustomerByEmail(email: string): Customer | undefined {
    const normalized = email.trim().toLowerCase();
    return this.data.customers.find((c) => c.email.trim().toLowerCase() === normalized);
  }

  public findCustomerByPhoneNormalized(phoneNormalized: string): Customer | undefined {
    return this.data.customers.find((c) => c.phone_normalized === phoneNormalized);
  }

  public addCustomer(customer: Customer): Customer {
    this.data.customers.unshift(customer);
    return customer;
  }

  public getPurchasesByCustomer(customerId: string): Purchase[] {
    return this.data.purchases
      .filter((p) => p.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addPurchase(purchase: Purchase): Purchase {
    this.data.purchases.unshift(purchase);
    return purchase;
  }

  public getMovementsByCustomer(customerId: string): PointMovement[] {
    return this.data.movements
      .filter((m) => m.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addMovement(movement: PointMovement): PointMovement {
    this.data.movements.unshift(movement);
    return movement;
  }
}

export const loyaltyStore = new InMemoryLoyaltyStore();
