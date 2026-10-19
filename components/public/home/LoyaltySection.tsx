import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface LoyaltySectionProps {
  euroToPointsRatio: number;
}

export function LoyaltySection({ euroToPointsRatio }: LoyaltySectionProps) {
  const pointsLabel = `${euroToPointsRatio} point${euroToPointsRatio > 1 ? "s" : ""}`;
  const steps = [
    {
      title: "Donnez votre nom en caisse",
      text: "Le caissier retrouve votre profil avec votre nom ou votre numéro de téléphone. Aucune carte à présenter.",
    },
    {
      title: `Cumulez 1 € = ${pointsLabel}`,
      text: "Vos points s'ajoutent automatiquement et débloquent les statuts Bronze, Silver, Gold et VIP.",
    },
    {
      title: "Profitez de vos remises",
      text: "Utilisez vos points en caisse pour une réduction immédiate sur le total de vos courses.",
    },
  ];

  return (
    <section
      id="fidelite"
      aria-labelledby="fidelite-title"
      className="scroll-mt-6 grid gap-10 rounded-[var(--radius-dialog)] bg-surface-hover p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-12"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary-ink">Programme fidélité</p>
          <h2 id="fidelite-title" className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Chaque euro dépensé vous rapporte des points
          </h2>
          <p className="text-base leading-relaxed text-text-muted">
            Gratuit, sans carte plastique, dès votre premier achat. Suivez votre solde et votre historique depuis
            votre espace client.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className={buttonVariants({ variant: "primary", size: "lg" })}>
            <span>Accéder à mon compte</span>
            <ArrowRight />
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Créer un compte
          </Link>
        </div>
      </div>

      <ol className="space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-base font-semibold text-text"
            >
              {index + 1}
            </span>
            <div className="space-y-1 pt-1.5">
              <h3 className="text-base font-semibold text-text">{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
