import Link from "next/link";
import { FileText } from "lucide-react";
import { LEGAL_PLACEHOLDER, STORE_COMPANY } from "@/lib/store/config";

interface LegalNoticeContentProps {
  /** Contact address, from the store settings. */
  contactEmail: string;
  /** Contact phone, from the store settings. */
  contactPhone: string;
}

interface Row {
  label: string;
  value: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-text">{title}</h2>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: Row[] }) {
  return (
    <dl className="space-y-1.5 rounded-[var(--radius-button)] border border-border bg-surface-hover p-4 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="font-semibold text-text sm:w-56 sm:shrink-0">{row.label}</dt>
          <dd className="min-w-0 break-words text-text-muted">{row.value || LEGAL_PLACEHOLDER}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Legal notice (LCEN art. 6-III): publisher, hosting, intellectual property, liability. */
export function LegalNoticeContent({ contactEmail, contactPhone }: LegalNoticeContentProps) {
  const company = STORE_COMPANY;
  const registry = `RCS ${company.rcsCity || LEGAL_PLACEHOLDER} ${company.siren}`;
  const { host, mediator } = company;

  return (
    <div className="w-full flex-1">
      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 md:py-16">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-ink">
            <FileText aria-hidden className="h-4 w-4" />
            <span>Informations légales</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Mentions légales</h1>
          <p className="text-lg leading-relaxed text-text-muted">
            Conformément à l’article 6-III de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie
            numérique (LCEN), voici les informations légales du site et de l’application Super Market Calais.
          </p>
        </header>

        <Section title="1. Éditeur du site">
          <Facts
            rows={[
              { label: "Raison sociale", value: company.legalName },
              { label: "Forme juridique", value: company.legalForm },
              { label: "Capital social", value: company.capital },
              { label: "Siège social", value: company.registeredOffice },
              { label: "SIREN", value: company.siren },
              { label: "SIRET (siège)", value: company.siret },
              { label: "Immatriculation", value: registry },
              { label: "TVA intracommunautaire", value: company.vatNumber },
              { label: "Code NAF / APE", value: company.nafCode },
              { label: "Téléphone", value: contactPhone },
              { label: "E-mail", value: contactEmail },
            ]}
          />
        </Section>

        <Section title="2. Directeur de la publication">
          <p className="text-text-muted">
            {company.publicationDirector}, {company.publicationDirectorRole.toLowerCase()} de {company.legalName}.
          </p>
        </Section>

        <Section title="3. Hébergement">
            <Facts
              rows={[
                { label: "Hébergeur", value: host.name },
                { label: "Adresse", value: host.address },
                { label: "Téléphone", value: host.phone },
                { label: "Site web", value: host.website },
                { label: "Localisation des serveurs", value: host.serverLocation },
              ]}
            />
        </Section>

        <Section title="4. Propriété intellectuelle">
          <p className="text-text-muted">
            Les textes, images, logos, marques et éléments graphiques du site sont la propriété de {company.legalName}
            {" "}ou de ses partenaires. Toute reproduction, représentation ou réutilisation sans autorisation écrite est
            interdite (articles L.335-2 et suivants du Code de la propriété intellectuelle).
          </p>
        </Section>

        <Section title="5. Responsabilité">
          <p className="text-text-muted">
            Nous veillons à l’exactitude des informations publiées (prix, promotions, arrivages, horaires), mais elles
            peuvent évoluer sans préavis et ne constituent pas une offre contractuelle. Les disponibilités en magasin
            prévalent. Le site peut contenir des liens vers des sites tiers dont nous ne contrôlons pas le contenu.
          </p>
        </Section>

        <Section title="6. Données personnelles et cookies">
          <p className="text-text-muted">
            Le traitement de vos données (compte client, programme de fidélité, communications) est décrit dans notre{" "}
            <Link href="/politique-de-confidentialite" className="font-semibold text-primary-ink hover:underline">
              politique de confidentialité
            </Link>
            . Vous pouvez exercer vos droits à tout moment à l’adresse{" "}
            <a href={`mailto:${contactEmail}`} className="font-semibold text-primary-ink hover:underline">
              {contactEmail}
            </a>
            .
          </p>
        </Section>

        <Section title="7. Médiation de la consommation">
          <p className="text-text-muted">
            En cas de litige non résolu avec notre service client, vous pouvez recourir gratuitement au médiateur de la
            consommation : {mediator.name || LEGAL_PLACEHOLDER}
            {mediator.address ? `, ${mediator.address}` : ""}
            {mediator.website ? ` — ${mediator.website}` : ""}.
          </p>
        </Section>

        <Section title="Droit applicable">
          <p className="text-text-muted">
            Le site est soumis au droit français. En cas de litige, les tribunaux français sont compétents, sous réserve
            des règles impératives applicables aux consommateurs.
          </p>
        </Section>
      </main>
    </div>
  );
}
