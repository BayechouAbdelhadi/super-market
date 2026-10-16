import { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { DealsManager } from "@/components/admin/deals/DealsManager";

export const metadata: Metadata = {
  title: "Bons Plans & Campagnes E-mails — Super Market Calais",
  description: "Création et programmation de campagnes e-mails bons plans ciblées par palier fidélité",
};

export default async function AdminDealsPage() {
  const settings = await getAppSettings();

  return (
    <DealsManager
      storeName={settings.store?.storeName}
      storeAddress={settings.store?.address}
      storePhone={settings.store?.phone}
    />
  );
}
