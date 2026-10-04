import { CashierDashboard } from "@/components/loyalty/CashierDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Fidélité — Caisse",
  description: "Système de fidélité pour caissier (Jalon 1 MVP)",
};

export default function LoyaltyPage() {
  return <CashierDashboard />;
}
