import { getLiveFeedData } from "@/lib/loyalty/analytics-service";
import { LiveFeedHub } from "@/components/admin/analytics/LiveFeedHub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Flux des Opérations en Direct",
  description: "Suivi en temps réel de tous les passages en caisse, achats et mouvements de points fidélité.",
};

export default async function AdminLiveFeedPage() {
  const initialData = await getLiveFeedData(100);

  return <LiveFeedHub initialData={initialData} />;
}
