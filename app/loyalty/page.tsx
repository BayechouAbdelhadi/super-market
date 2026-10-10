import { CashierDashboard } from "@/components/loyalty/CashierDashboard";
import { getAppSettings } from "@/lib/settings/service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Fidélité — Caisse",
  description: "Système de fidélité pour caissier (Jalon 1 MVP)",
};

export default async function LoyaltyPage() {
  const settings = await getAppSettings();
  return <CashierDashboard settings={settings} />;
}
