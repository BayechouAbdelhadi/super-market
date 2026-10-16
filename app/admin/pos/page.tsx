import { CashierDashboard } from "@/components/loyalty/CashierDashboard";
import { getAppSettings } from "@/lib/settings/service";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SuperMarket Fidélité — Caisse",
  description: "Recherche client et gestion des points de fidélité au comptoir",
};

export default async function AdminPosPage() {
  const settings = await getAppSettings();
  return <CashierDashboard standalone={false} settings={settings} />;
}
