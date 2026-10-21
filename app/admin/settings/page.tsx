import { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { SettingsManager } from "@/components/admin/settings/SettingsManager";

export const metadata: Metadata = {
  title: "Paramètres",
  description: "Paramètres du programme fidélité, conversion des points, caisse et informations magasin",
};

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return <SettingsManager initialSettings={settings} />;
}
