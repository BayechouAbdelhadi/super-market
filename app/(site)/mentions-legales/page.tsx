import type { Metadata } from "next";
import { LegalNoticeContent } from "@/components/public/LegalNoticeContent";
import { getAppSettings } from "@/lib/settings/service";
import { BASE_OPEN_GRAPH, SITE_NAME } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de Super Market Calais : éditeur, SIREN, SIRET, TVA, directeur de la publication, hébergement et propriété intellectuelle.",
  alternates: {
    canonical: "/mentions-legales",
  },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: `Mentions légales — ${SITE_NAME}`,
    description: "Informations légales de l'éditeur du site et de l'application Super Market Calais.",
    url: "/mentions-legales",
  },
};

export default async function MentionsLegalesPage() {
  const { store } = await getAppSettings();
  return <LegalNoticeContent contactEmail={store.email} contactPhone={store.phone} />;
}
