import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { DEFAULT_OPENING_HOURS } from "@/lib/store/config";
import type { OpeningHours } from "@/lib/store/opening-hours";

export interface LoyaltySettings {
  /** Value of 1 loyalty point in Euros. Default is 0.05 (100 points = 5 €) */
  pointValueInEuro: number;
  /** Points earned per Euro spent. Default is 1 (1 € = 1 pt) */
  euroToPointsRatio: number;
  /** Minimum points required to use a discount in cash register */
  minPointsToRedeem: number;
  /** Maximum discount in Euros allowed per single transaction (0 for unlimited) */
  maxDiscountPerTransactionEuro: number;
  /** Historical points threshold for Silver tier */
  tierSilverMinPoints: number;
  /** Historical points threshold for Gold tier */
  tierGoldMinPoints: number;
  /** Historical points threshold for VIP tier */
  tierVipMinPoints: number;
}

export interface PosSettings {
  /** Default cashier register name/label */
  defaultCashierStation: string;
  /** Quick purchase amount preset buttons in POS (€) */
  quickPurchaseAmounts: number[];
  /** Default reason text shown on receipt for points deduction */
  defaultRedeemReason: string;
}

export interface StoreSettings {
  /** Official store name */
  storeName: string;
  /** Commercial tagline */
  tagline: string;
  /** Store physical address */
  address: string;
  /** Store phone number */
  phone: string;
  /** Store contact email */
  email: string;
}

export interface NotificationSettings {
  /** Email address from which notifications are sent (Expéditeur des emails) */
  senderEmail: string;
  /** Display name of the sender (e.g. Super Market Calais) */
  senderName: string;
  /** Whether to automatically send an activation email when a customer is registered */
  sendWelcomeEmail: boolean;
  /** Whether to automatically send a collaboration invitation email when a cashier is created */
  sendCashierInviteEmail: boolean;
}

export interface AppSettings {
  loyalty: LoyaltySettings;
  pos: PosSettings;
  store: StoreSettings;
  notifications: NotificationSettings;
  /** Weekly opening hours and exceptional closures shown on the public site */
  hours: OpeningHours;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  loyalty: {
    pointValueInEuro: LOYALTY_CONFIG.conversion.pointValueInEuro,
    euroToPointsRatio: LOYALTY_CONFIG.conversion.euroToPointsRatio,
    minPointsToRedeem: 50,
    maxDiscountPerTransactionEuro: 50.0,
    tierSilverMinPoints: LOYALTY_CONFIG.tiers.SILVER.minHistoricalPoints,
    tierGoldMinPoints: LOYALTY_CONFIG.tiers.GOLD.minHistoricalPoints,
    tierVipMinPoints: LOYALTY_CONFIG.tiers.VIP.minHistoricalPoints,
  },
  pos: {
    defaultCashierStation: LOYALTY_CONFIG.defaults.cashierName,
    quickPurchaseAmounts: [...LOYALTY_CONFIG.presets.purchaseAmounts],
    defaultRedeemReason: LOYALTY_CONFIG.defaults.redeemReason,
  },
  store: {
    storeName: "Super Market Calais",
    tagline: "Votre supermarché de proximité à Calais",
    address: "123 Boulevard Lafayette, 62100 Calais",
    phone: "03 21 00 00 00",
    email: "contact@supermarket-calais.fr",
  },
  notifications: {
    senderEmail: process.env.BREVO_SENDER_EMAIL || "notifications@supermarket-calais.fr",
    senderName: process.env.BREVO_SENDER_NAME || "Super Market Calais",
    sendWelcomeEmail: true,
    sendCashierInviteEmail: true,
  },
  hours: {
    weekly: DEFAULT_OPENING_HOURS,
    closures: [],
  },
};
