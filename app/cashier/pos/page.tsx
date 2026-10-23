import { CashierDashboard } from "@/components/loyalty/CashierDashboard";
import { getAppSettings } from "@/lib/settings/service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caisse fidélité",
  description: "Recherche client et gestion des points de fidélité au comptoir",
};

interface CashierPosPageProps {
  searchParams?: Promise<{ customer?: string }>;
}

export default async function CashierPosPage({ searchParams }: CashierPosPageProps) {
  const params = searchParams ? await searchParams : {};
  const settings = await getAppSettings();
  return <CashierDashboard settings={settings} initialCustomerId={params.customer} />;
}
