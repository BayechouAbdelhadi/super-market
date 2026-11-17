import Link from "next/link";
import { FileText } from "lucide-react";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { STORE_COMPANY } from "@/lib/store/config";

interface LoyaltyRulesContentProps {
  /** Contact address, from the store settings. */
  contactEmail: string;
}

const { conversion, tiers } = LOYALTY_CONFIG;

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const number = new Intl.NumberFormat("fr-FR");

/** Points needed for a 1 € discount, derived from the point value. */
const POINTS_PER_EURO_DISCOUNT = Math.round(1 / conversion.pointValueInEuro);

const TIER_LIST = [tiers.BRONZE, tiers.SILVER, tiers.GOLD, tiers.VIP];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-text">{title}</h2>
      <div className="space-y-3 text-text-muted">{children}</div>
    </section>
  );
}

/** Terms of the loyalty program (règlement). Every figure comes from `LOYALTY_CONFIG`. */
export function LoyaltyRulesContent({ contactEmail }: LoyaltyRulesContentProps) {
  const mailLink = (
    <a href={`mailto:${contactEmail}`} className="font-semibold text-primary-ink hover:underline">
      {contactEmail}
    </a>
  );

  return (
    <div className="w-full flex-1">
      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 md:py-16">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-ink">
            <FileText aria-hidden className="h-4 w-4" />
            <span>Conditions du programme</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Règlement du programme de fidélité</h1>
          <p className="text-lg leading-relaxed text-text-muted">
            Ce règlement régit le programme de fidélité de {STORE_COMPANY.legalName}, {STORE_COMPANY.registeredOffice}.
            En créant un compte fidélité, vous l’acceptez.
          </p>
        </header>

        <Section title="1. Adhésion">
          <p>
            Le programme est gratuit et réservé aux personnes majeures ou disposant de l’accord de leur représentant
            légal. Chaque personne ne peut détenir qu’un seul compte. L’adhésion se fait en magasin ou sur le site, avec
            un nom, un prénom, un numéro de téléphone et une adresse e-mail exacts.
          </p>
        </Section>

        <Section title="2. Gagner des points">
          <p>
            Chaque achat en magasin enregistré en caisse avec votre compte rapporte {number.format(conversion.euroToPointsRatio)}{" "}
            point par euro dépensé, arrondi à l’entier inférieur. Présentez votre carte (QR code) ou votre numéro de
            téléphone avant le paiement : les points ne sont pas ajoutés après coup sans justificatif.
          </p>
        </Section>

        <Section title="3. Utiliser ses points">
          <p>
            {number.format(POINTS_PER_EURO_DISCOUNT)} points donnent droit à une remise de {euro.format(1)} sur vos
            achats, soit {euro.format(conversion.pointValueInEuro)} par point. Les points s’utilisent en caisse, sur
            demande, avant l’encaissement. Ils ne sont ni remboursables, ni échangeables contre de l’argent, ni
            cessibles.
          </p>
        </Section>

        <Section title="4. Statuts">
          <p>Votre statut dépend du total de points gagnés depuis l’ouverture du compte. Utiliser des points ne le baisse pas.</p>
          <ul className="list-disc space-y-1 pl-5">
            {TIER_LIST.map((tier) => (
              <li key={tier.name}>
                <strong className="text-text">{tier.label}</strong> : à partir de {number.format(tier.minHistoricalPoints)} points gagnés
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Durée de validité des points">
          <p>
            À la date de ce règlement, les points n’ont pas de date d’expiration. Seule exception : un compte sans
            aucune activité (achat ou connexion) pendant 3 ans est supprimé ou anonymisé, comme indiqué dans la
            politique de confidentialité, et ses points sont perdus. Toute durée de validité future sera
            annoncée en magasin et sur le site au moins 30 jours avant son entrée en vigueur, et ne s’appliquera pas aux
            points déjà acquis avant cette annonce.
          </p>
        </Section>

        <Section title="6. Erreurs et fraude">
          <p>
            En cas d’erreur de saisie en caisse, nous pouvons corriger votre solde. Toute utilisation frauduleuse
            (création de faux comptes, points obtenus sans achat) entraîne l’annulation des points concernés et peut
            entraîner la fermeture du compte.
          </p>
        </Section>

        <Section title="7. Modification et fin du programme">
          <p>
            Nous pouvons modifier ce règlement ou arrêter le programme. Vous en êtes informé en magasin et sur le site
            au moins 30 jours avant. En cas d’arrêt, vous pouvez utiliser vos points pendant ce délai.
          </p>
        </Section>

        <Section title="8. Fermer son compte">
          <p>
            Vous pouvez fermer votre compte et demander l’effacement de vos données à tout moment, en magasin ou à
            l’adresse {mailLink}. Les points restants sont alors perdus.
          </p>
        </Section>

        <Section title="9. Données personnelles">
          <p>
            Vos données sont traitées selon notre{" "}
            <Link href="/politique-de-confidentialite" className="font-semibold text-primary-ink hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </Section>

        <Section title="10. Réclamations et droit applicable">
          <p>
            Pour toute réclamation, écrivez à {mailLink}. Ce règlement est soumis au droit français.
            {STORE_COMPANY.mediator.name &&
              ` En cas de litige non résolu, vous pouvez saisir gratuitement le médiateur de la consommation : ${STORE_COMPANY.mediator.name}.`}
          </p>
        </Section>
      </main>
    </div>
  );
}
