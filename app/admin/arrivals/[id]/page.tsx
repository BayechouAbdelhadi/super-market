import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { getArrival, getArrivalStats, listArrivalReservations } from "@/lib/arrivals/service";
import { ArrivalIdSchema } from "@/lib/arrivals/validation";
import { ArrivalDetail } from "@/components/admin/arrivals/ArrivalDetail";
import { ArrivalsComingSoon } from "@/components/arrivals/ArrivalsComingSoon";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const metadata: Metadata = {
  title: "Arrivage",
  description: "Chiffres, articles et réservations d'un arrivage",
};

interface AdminArrivalPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminArrivalPage({ params }: AdminArrivalPageProps) {
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

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const arrival = await getArrival(id.data);
  if (!arrival) notFound();

  const [stats, reservations] = await Promise.all([
    getArrivalStats(arrival.id),
    listArrivalReservations(arrival.id, null, 0, ARRIVALS_CONFIG.reservationsPageSize),
  ]);

  return (
    <ArrivalDetail
      arrival={arrival}
      stats={stats}
      initialReservations={reservations.items}
      initialTotal={reservations.total}
    />
  );
}
