import React from "react";
import type { Metadata } from "next";
import PrivacyPolicyContent from "@/components/public/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Super Market Calais",
  description:
    "Official Privacy Policy of Super Market Calais compliant with GDPR and Meta/Facebook Platform requirements.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/politique-de-confidentialite",
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicyContent />;
}
