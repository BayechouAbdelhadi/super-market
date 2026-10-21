import { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { CampaignEditorPage } from "@/components/admin/deals/CampaignEditorPage";

export const metadata: Metadata = {
  title: "Nouvelle campagne e-mail",
  description: "Création et configuration d'une campagne de bons plans par e-mail ciblée par palier fidélité",
};

export default async function NewDealCampaignPage() {
  const { store } = await getAppSettings();

  return <CampaignEditorPage storeName={store.storeName} storeAddress={store.address} storePhone={store.phone} />;
}
