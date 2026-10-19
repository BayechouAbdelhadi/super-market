import { DepartmentCard, type DepartmentCardProps } from "@/components/public/DepartmentCard";
import { SectionHeading } from "./SectionHeading";

/** Store departments, in display order. */
const DEPARTMENTS: DepartmentCardProps[] = [
  {
    title: "Poulet frais & charcuterie",
    description:
      "Filets, cuisses, ailes et pilons en barquette, accompagnés de notre sélection de charcuterie traditionnelle.",
    image: { src: "/categories/poulet-frais-sample.jpg", alt: "Poulet frais en barquette" },
    badge: "Fraîcheur",
    highlights: ["Arrivage quotidien", "100% Halal"],
  },
  {
    title: "Boissons en pack",
    description: "Sodas, jus, eaux minérales et boissons rafraîchissantes en stock permanent, aux meilleurs prix.",
    image: { src: "/categories/fanta-pack-sample.jpg", alt: "Pack de canettes de Fanta orange" },
    badge: "N°1 à Calais",
    highlights: ["+60 références", "Prix de gros"],
  },
  {
    title: "Surgelés",
    description: (
      <>
        Viandes, böreks et plats préparés, avec en exclusivité les marques <strong>Hunkar</strong> et{" "}
        <strong>Idéal Délices</strong>.
      </>
    ),
    image: { src: "/categories/surgeles-assortiment.jpg", alt: "Assortiment de böreks, köftes et lahmacun surgelés" },
    badge: "+100 réf.",
    highlights: ["Marques exclusives", "Chaîne du froid"],
  },
  {
    title: "Pâtisserie orientale",
    description: "Baklawas croustillants au miel et aux pistaches, cornes de gazelle et makrouts.",
    image: { src: "/categories/baklava-sample.jpg", alt: "Baklavas aux pistaches et au miel" },
    badge: "Gourmandise",
    highlights: ["Pur miel", "Artisanal"],
  },
  {
    title: "Fruits & légumes",
    description: "Arrivages réguliers de fruits savoureux et de légumes de saison.",
    image: { src: "/categories/fruits-legumes-sample.jpg", alt: "Étal de fruits et légumes frais" },
    badge: "Primeur",
    highlights: ["Produits de saison", "Fraîcheur garantie"],
  },
  {
    title: "Épicerie & produits frais",
    description: "Produits laitiers, conserves, épices du monde, riz, sauces et toutes vos marques du quotidien.",
    image: { src: "/categories/epicerie-sample.jpg", alt: "Épices, huiles et condiments d'épicerie" },
    badge: "Essentiels",
    highlights: ["Large choix", "Épices du monde"],
  },
];

/**
 * Departments grid. On phones it is a horizontal swipe row (the next card peeks out to show there is more)
 * instead of six full-width cards stacked.
 */
export function DepartmentsSection() {
  return (
    <section id="rayons" aria-labelledby="rayons-title" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="rayons-title"
        eyebrow="Nos rayons"
        title="Tout pour vos courses du quotidien"
        description="Une sélection rigoureuse pour régaler toute la famille, au meilleur prix."
      />
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {DEPARTMENTS.map((department) => (
          <li key={department.title} className="w-[82%] shrink-0 snap-start sm:w-auto">
            <DepartmentCard {...department} />
          </li>
        ))}
      </ul>
    </section>
  );
}
