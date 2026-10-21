import type { Metadata } from "next";
import PrivacyPolicyContent from "@/components/public/PrivacyPolicyContent";
import { getAppSettings } from "@/lib/settings/service";
import { BASE_OPEN_GRAPH, SITE_NAME } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Protection de vos données personnelles chez Super Market Calais : données collectées, programme de fidélité, durée de conservation et exercice de vos droits (RGPD).",
  alternates: {
    canonical: "/politique-de-confidentialite",
  },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: `Politique de confidentialité — ${SITE_NAME}`,
    description: "Protection de vos données personnelles et conditions de traitement conformément au RGPD.",
    url: "/politique-de-confidentialite",
  },
};

export default async function PolitiqueConfidentialitePage() {
  const { store } = await getAppSettings();
  return <PrivacyPolicyContent contactEmail={store.email} />;
}
