import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getAppSettings } from "@/lib/settings/service";
import { CampaignEditorPage } from "@/components/admin/deals/CampaignEditorPage";

export const metadata: Metadata = {
  title: "Créer une Campagne E-mail — Super Market Calais",
  description: "Création et configuration d'une campagne de bons plans par e-mail ciblée par palier fidélité",
};

export default async function NewDealCampaignPage() {
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
    <DashboardLayout role={role} email={email} storeName={settings.store?.storeName}>
      <CampaignEditorPage
        storeName={settings.store?.storeName}
        storeAddress={settings.store?.address}
        storePhone={settings.store?.phone}
      />
    </DashboardLayout>
  );
}
