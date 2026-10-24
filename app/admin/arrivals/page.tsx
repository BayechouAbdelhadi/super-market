import { Metadata } from "next";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { listArrivals } from "@/lib/arrivals/service";
import type { ArrivalPage } from "@/lib/arrivals/types";
import { ArrivalsManager } from "@/components/admin/arrivals/ArrivalsManager";
import { ArrivalsComingSoon } from "@/components/arrivals/ArrivalsComingSoon";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const metadata: Metadata = {
  title: "Arrivages",
  description: "Arrivages proposés à la réservation (dates, articles, stock) et leurs réservations",
};

export default async function AdminArrivalsPage() {
  if (!isArrivalsAdminEnabled()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Arrivages</h1>
        <ArrivalsComingSoon
          title="Les arrivages arrivent bientôt"
          description="Vous pourrez bientôt proposer des arrivages à la réservation (dates, articles, stock) et suivre les réservations de vos clients."
        />
      </div>
    );
  }

  let initial: ArrivalPage = { items: [], total: 0 };
  let loadFailed = false;
  try {
    initial = await listArrivals(0, ARRIVALS_CONFIG.listPageSize);
  } catch (err) {
    console.error("[AdminArrivalsPage] Failed to load arrivals:", err);
    loadFailed = true;
  }

  return <ArrivalsManager initialArrivals={initial.items} initialTotal={initial.total} loadFailed={loadFailed} />;
}
