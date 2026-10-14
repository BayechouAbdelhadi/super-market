import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getAppSettings } from "@/lib/settings/service";
import { DealsManager } from "@/components/admin/deals/DealsManager";

export const metadata: Metadata = {
  title: "Bons Plans & Campagnes E-mails — Super Market Calais",
  description: "Création et programmation de campagnes e-mails bons plans ciblées par palier fidélité",
};

export default async function AdminDealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role || "CUSTOMER";
  if (role !== "ADMIN") {
    redirect(role === "CASHIER" ? "/cashier" : "/account");
  }

  const email = user.email || "";
  const settings = await getAppSettings();

  return (
    <DashboardLayout role={role} email={email}>
      <DealsManager
        storeName={settings.store?.storeName}
        storeAddress={settings.store?.address}
        storePhone={settings.store?.phone}
      />
    </DashboardLayout>
  );
}
