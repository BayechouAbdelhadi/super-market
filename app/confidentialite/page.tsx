import React from "react";
import type { Metadata } from "next";
import PrivacyPolicyContent from "@/components/public/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Confidentialité & Données Personnelles | Super Market Calais",
  description:
    "Politique de confidentialité et protection des données personnelles de Super Market Calais.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/politique-de-confidentialite",
  },
};

export default function ConfidentialitePage() {
  return <PrivacyPolicyContent />;
}
