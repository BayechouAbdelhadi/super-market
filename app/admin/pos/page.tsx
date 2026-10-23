import { CashierDashboard } from "@/components/loyalty/CashierDashboard";
import { getAppSettings } from "@/lib/settings/service";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Caisse fidélité",
  description: "Recherche client et gestion des points de fidélité au comptoir",
};

interface AdminPosPageProps {
  searchParams?: Promise<{ customer?: string }>;
}

export default async function AdminPosPage({ searchParams }: AdminPosPageProps) {
  const params = searchParams ? await searchParams : {};
  const settings = await getAppSettings();
  return <CashierDashboard settings={settings} initialCustomerId={params.customer} />;
}
