import { ArrivalCard } from "@/components/arrivals/ArrivalCard";
import { ArrivalsComingSoon } from "@/components/arrivals/ArrivalsComingSoon";
import type { Arrival } from "@/lib/arrivals/types";
import { SectionHeading } from "./SectionHeading";

/**
 * Arrivals open (or about to open) for reservation, shown before the departments. Hidden when there are none.
 * `arrivals` is null while the customer flag is off: the section announces the feature instead.
 */
export function ArrivalsSection({ arrivals, now }: { arrivals: Arrival[] | null; now: Date }) {
  if (arrivals?.length === 0) return null;

  return (
    <section id="arrivages" aria-labelledby="arrivages-title" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="arrivages-title"
        eyebrow="Arrivages"
        title="Réservez avant l'arrivage"
        description="Réservez en ligne, puis venez chercher votre commande en magasin le jour de l'arrivage. Paiement sur place."
      />
      {arrivals ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {arrivals.map((arrival) => (
            <li key={arrival.id}>
              <ArrivalCard arrival={arrival} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <ArrivalsComingSoon title="La réservation d'arrivages arrive" description="Bientôt, réservez en ligne les arrivages du magasin (poulet frais…) et venez chercher votre commande le jour de l'arrivage." />
      )}
    </section>
  );
}
