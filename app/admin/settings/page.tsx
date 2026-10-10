import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getAppSettings } from "@/lib/settings/service";
import { SettingsManager } from "@/components/admin/settings/SettingsManager";

export const metadata: Metadata = {
  title: "Configuration de l'application — Super Market Calais",
  description: "Paramètres du programme fidélité, conversion des points, caisse et informations magasin",
};

export default async function AdminSettingsPage() {
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
      <SettingsManager initialSettings={settings} />
    </DashboardLayout>
  );
}
