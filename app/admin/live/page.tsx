import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getLiveFeedData } from "@/lib/loyalty/analytics-service";
import { LiveFeedHub } from "@/components/admin/analytics/LiveFeedHub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Flux des Opérations en Direct",
  description: "Suivi en temps réel de tous les passages en caisse, achats et mouvements de points fidélité.",
};

export default async function AdminLiveFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || "ADMIN";
  const email = user?.email || "";

  // Fetch extended live feed data (up to 100 recent transactions)
  const initialData = await getLiveFeedData(100);

  return (
    <DashboardLayout role={role} email={email}>
      <LiveFeedHub initialData={initialData} />
    </DashboardLayout>
  );
}
