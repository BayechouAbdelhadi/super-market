import React from "react";
import type { Metadata } from "next";
import PrivacyPolicyContent from "@/components/public/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Super Market Calais",
  description:
    "Politique officielle de confidentialité et de protection des données personnelles de Super Market Calais. Conforme au RGPD et aux exigences Meta/Facebook.",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/politique-de-confidentialite",
  },
  openGraph: {
    title: "Politique de Confidentialité | Super Market Calais",
    description:
      "Protection de vos données personnelles et conditions de traitement conformément au RGPD.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function PolitiqueConfidentialitePage() {
  return <PrivacyPolicyContent />;
}
