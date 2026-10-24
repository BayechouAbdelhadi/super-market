import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ShoppingBasket } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/public/Breadcrumb";
import { ArrivalsComingSoon } from "@/components/arrivals/ArrivalsComingSoon";
import { ReservationForm } from "@/components/arrivals/ReservationForm";
import { arrivalPath } from "@/components/arrivals/ArrivalCard";
import { formatDateTime, formatDay } from "@/components/arrivals/format";
import { ARRIVAL_CATEGORY_LABELS, ARRIVAL_PHASE_LABELS } from "@/lib/arrivals/config";
import { getArrivalPhase } from "@/lib/arrivals/domain";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";
import { getArrival } from "@/lib/arrivals/service";
import { ArrivalIdSchema } from "@/lib/arrivals/validation";
import { withNextParam } from "@/lib/auth/redirect";
import { resolveUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

// Stock and the open/closed state change all the time
export const dynamic = "force-dynamic";

interface ArrivalPageProps {
  params: Promise<{ id: string }>;
}

async function loadArrival(params: ArrivalPageProps["params"]) {
  if (!isArrivalsCustomerEnabled()) return null;
  const id = ArrivalIdSchema.safeParse((await params).id);
  return id.success ? getArrival(id.data) : null;
}

export async function generateMetadata({ params }: ArrivalPageProps): Promise<Metadata> {
  const arrival = await loadArrival(params);
  if (!arrival) return {};
  return {
    title: `Réserver : ${arrival.title}`,
    description: `Réservez en ligne et retirez votre commande en magasin le ${formatDay(arrival.pickupDate)}.`,
    alternates: { canonical: arrivalPath(arrival.id) },
  };
}

/** Reservation page of one arrival. Reserving needs a customer account: visitors are sent to log in and come back. */
export default async function ArrivalPage({ params }: ArrivalPageProps) {
  if (!isArrivalsCustomerEnabled()) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
        <ArrivalsComingSoon title="La réservation d'arrivages arrive" description="Bientôt, réservez en ligne les arrivages du magasin (poulet frais…) et venez chercher votre commande le jour de l'arrivage." />
      </main>
    );
  }

  const arrival = await loadArrival(params);
  if (!arrival) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await resolveUserRole(supabase, user) : null;

  const now = new Date();
  const phase = getArrivalPhase(arrival, now);
  const path = arrivalPath(arrival.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <Breadcrumb
        items={[
          { name: "Accueil", path: "/" },
          { name: "Arrivages", path: "/#arrivages" },
          { name: arrival.title, path },
        ]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="md">
            {ARRIVAL_CATEGORY_LABELS[arrival.category]}
          </Badge>
          <Badge variant={phase === "OPEN" ? "success" : "warning"} size="md">
            {ARRIVAL_PHASE_LABELS[phase]}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{arrival.title}</h1>
        {arrival.description && <p className="text-base leading-relaxed text-text-muted">{arrival.description}</p>}
        <ul className="space-y-2 text-sm text-text">
          <li className="flex items-center gap-2">
            <CalendarClock aria-hidden className="size-4 shrink-0 text-text-muted" />
            Réservations du {formatDateTime(arrival.reservationOpensAt)} au {formatDateTime(arrival.reservationClosesAt)}
          </li>
          <li className="flex items-center gap-2">
            <ShoppingBasket aria-hidden className="size-4 shrink-0 text-text-muted" />
            Retrait et paiement en magasin le {formatDay(arrival.pickupDate)}
          </li>
        </ul>
      </div>

      {phase === "SCHEDULED" && (
        <Alert variant="info">Les réservations ouvriront le {formatDateTime(arrival.reservationOpensAt)}.</Alert>
      )}
      {(phase === "CLOSED" || phase === "FINISHED") && (
        <Alert variant="danger">Les réservations sont clôturées pour cet arrivage.</Alert>
      )}

      {!user ? (
        <Card padded="lg" className="gap-4 text-center">
          <p className="text-base font-semibold text-text">Connectez-vous pour réserver</p>
          <p className="text-sm text-text-muted">
            La réservation est liée à votre compte fidélité : présentez votre carte en caisse le jour du retrait.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={withNextParam("/login", path)} className={buttonVariants({ variant: "primary" })}>
              Se connecter
            </Link>
            <Link href={withNextParam("/signup", path)} className={buttonVariants({ variant: "secondary" })}>
              Créer un compte
            </Link>
          </div>
        </Card>
      ) : role !== "CUSTOMER" ? (
        <Alert variant="info">La réservation en ligne est réservée aux comptes clients.</Alert>
      ) : (
        <ReservationForm arrival={arrival} canReserve={phase === "OPEN"} />
      )}
    </main>
  );
}
