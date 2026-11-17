import type { Metadata } from "next";
import { LoyaltyRulesContent } from "@/components/public/LoyaltyRulesContent";
import { getAppSettings } from "@/lib/settings/service";
import { BASE_OPEN_GRAPH, SITE_NAME } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Règlement du programme de fidélité",
  description:
    "Règlement du programme de fidélité de Super Market Calais : gagner et utiliser ses points, statuts Bronze, Silver, Gold et VIP, fermeture du compte.",
  alternates: {
    canonical: "/reglement-fidelite",
  },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: `Règlement du programme de fidélité — ${SITE_NAME}`,
    description: "Conditions pour gagner et utiliser vos points de fidélité.",
    url: "/reglement-fidelite",
  },
};

export default async function ReglementFidelitePage() {
  const { store, loyalty } = await getAppSettings();
  return <LoyaltyRulesContent contactEmail={store.email} loyalty={loyalty} />;
}
