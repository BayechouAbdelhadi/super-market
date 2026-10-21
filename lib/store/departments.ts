import type { FaqItem } from "./faq";

/**
 * Store departments ("rayons"), in display order: the home page cards and the /rayons/[slug] pages.
 * Each page targets one local search ("… à Calais"). Texts only state facts the store confirmed
 * (halal poultry, daily delivery, exclusive brands…): review them before adding new claims.
 */
export interface Department {
  slug: string;
  /** Card title on the home page. */
  title: string;
  /** H1 of the department page, with the local keyword. */
  heading: string;
  /** Meta description (≤ 160 characters). */
  metaDescription: string;
  /** Card text on the home page. */
  summary: string;
  image: { src: string; alt: string };
  /** Short label on the photo, e.g. "Turquie · Maroc". */
  badge: string;
  /** Key selling points, e.g. ["Arrivage quotidien", "100% Halal"]. */
  highlights: string[];
  /** Page body, one paragraph per entry. */
  paragraphs: string[];
  /** "Ce que vous trouverez" list on the page. */
  products: string[];
  faq: FaqItem[];
}

export const DEPARTMENTS: Department[] = [
  {
    slug: "produits-turcs-marocains",
    title: "Alimentation & produits méditerranéens",
    heading: "Produits turcs et marocains à Calais",
    metaDescription:
      "Produits turcs et marocains à Calais : huiles d'olive, olives, épices, semoule, thés et conserves chez Super Market Calais, quartier Saint-Exupéry.",
    summary:
      "Les saveurs de Turquie, du Maroc et de tout le bassin méditerranéen : huiles d'olive, olives, épices, semoule, thés, conserves et spécialités du quotidien.",
    // Photo: Joanna Stołowicz on Unsplash (Unsplash License), rotated and cropped to landscape
    image: { src: "/categories/produits-mediterraneens.jpg", alt: "Bols d'olives vertes et noires sur un plan de travail clair" },
    badge: "Turquie · Maroc",
    highlights: ["Produits de Turquie", "Produits du Maroc", "Large choix"],
    paragraphs: [
      "Vous cherchez des produits turcs ou marocains à Calais ? Notre rayon méditerranéen réunit les saveurs de Turquie, du Maroc et de tout le bassin méditerranéen, sans avoir à courir plusieurs magasins.",
      "Huiles d'olive, olives, épices, semoule, thés et conserves : on y trouve les produits de base de la cuisine familiale comme les spécialités pour les grandes occasions. Le rayon est complété par nos surgelés et notre pâtisserie orientale, pour préparer un repas complet en un seul passage.",
      "Le magasin est situé dans le quartier Saint-Exupéry, avec des places de stationnement gratuites devant l'entrée, et il est ouvert 7 jours sur 7.",
    ],
    products: ["Huiles d'olive et olives", "Épices et mélanges", "Semoule", "Thés", "Conserves et spécialités"],
    faq: [
      {
        question: "Où acheter des produits turcs à Calais ?",
        answer:
          "Chez Super Market Calais, dans le quartier Saint-Exupéry : notre rayon méditerranéen propose une large sélection de produits de Turquie, ouvert 7 jours sur 7.",
      },
      {
        question: "Vendez-vous des produits marocains ?",
        answer: "Oui : épices, semoule, thés, olives et conserves du Maroc font partie du rayon, à côté des produits turcs.",
      },
    ],
  },
  {
    slug: "poulet-frais-halal",
    title: "Poulet frais & charcuterie",
    heading: "Poulet frais halal à Calais",
    metaDescription:
      "Poulet frais 100 % halal à Calais : filets, cuisses, ailes et pilons en barquette, arrivage quotidien, et charcuterie chez Super Market Calais.",
    summary:
      "Filets, cuisses, ailes et pilons en barquette, accompagnés de notre sélection de charcuterie traditionnelle.",
    image: { src: "/categories/poulet-frais-sample.jpg", alt: "Poulet frais en barquette" },
    badge: "Fraîcheur",
    highlights: ["Arrivage quotidien", "100% Halal"],
    paragraphs: [
      "Notre rayon volaille propose du poulet frais 100 % halal, livré chaque jour : la fraîcheur d'une boucherie de quartier, avec la praticité d'un supermarché.",
      "Filets, cuisses, ailes et pilons sont conditionnés en barquette, prêts à cuisiner pour les repas de la semaine comme pour les grandes tablées. Le rayon propose aussi une sélection de charcuterie traditionnelle.",
      "Pour compléter vos courses, retrouvez juste à côté nos épices, notre semoule et nos fruits et légumes de saison.",
    ],
    products: ["Filets de poulet", "Cuisses et pilons", "Ailes de poulet", "Charcuterie traditionnelle"],
    faq: [
      {
        question: "Votre poulet est-il halal ?",
        answer: "Oui, nos volailles fraîches sont 100 % halal.",
      },
      {
        question: "Le poulet est-il livré tous les jours ?",
        answer: "Oui, le rayon volaille est réapprovisionné chaque jour pour garantir la fraîcheur.",
      },
    ],
  },
  {
    slug: "boissons-en-pack",
    title: "Boissons en pack",
    heading: "Boissons en pack pas chères à Calais",
    metaDescription:
      "Boissons en pack à Calais : sodas, jus, eaux minérales, plus de 60 références en stock permanent à prix de gros chez Super Market Calais.",
    summary: "Sodas, jus, eaux minérales et boissons rafraîchissantes en stock permanent, aux meilleurs prix.",
    image: { src: "/categories/fanta-pack-sample.jpg", alt: "Pack de canettes de Fanta orange" },
    badge: "N°1 à Calais",
    highlights: ["+60 références", "Prix de gros"],
    paragraphs: [
      "Fête de famille, anniversaire, ramadan ou simple réserve pour la maison : notre rayon boissons en pack propose plus de 60 références en stock permanent, à prix de gros.",
      "Sodas, jus de fruits, eaux minérales et boissons rafraîchissantes sont disponibles en packs, pour faire le plein en une seule fois. Les places de stationnement gratuites devant le magasin permettent de charger facilement la voiture.",
    ],
    products: ["Sodas en canettes et bouteilles", "Jus de fruits", "Eaux minérales", "Boissons rafraîchissantes"],
    faq: [
      {
        question: "Où acheter des boissons en pack pas chères à Calais ?",
        answer:
          "Chez Super Market Calais : plus de 60 références de boissons en pack, à prix de gros, en stock permanent.",
      },
      {
        question: "Peut-on se garer pour charger les packs ?",
        answer: "Oui, des places de stationnement gratuites se trouvent devant le magasin.",
      },
    ],
  },
  {
    slug: "surgeles",
    title: "Surgelés",
    heading: "Surgelés Hunkar et Idéal Délices à Calais",
    metaDescription:
      "Surgelés à Calais : viandes, böreks et plats préparés, plus de 100 références dont les marques Hunkar et Idéal Délices en exclusivité.",
    summary:
      "Viandes, böreks et plats préparés, avec en exclusivité les marques Hunkar et Idéal Délices.",
    image: { src: "/categories/surgeles-assortiment.jpg", alt: "Assortiment de böreks, köftes et lahmacun surgelés" },
    badge: "+100 réf.",
    highlights: ["Marques exclusives", "Chaîne du froid"],
    paragraphs: [
      "Notre rayon surgelés compte plus de 100 références, avec en exclusivité les marques Hunkar et Idéal Délices : de quoi préparer un repas rapide sans renoncer aux saveurs de la cuisine turque.",
      "Viandes, böreks et plats préparés sont conservés dans le respect de la chaîne du froid, du congélateur du magasin jusqu'à votre panier.",
    ],
    products: ["Viandes surgelées", "Böreks", "Plats préparés", "Marques Hunkar et Idéal Délices"],
    faq: [
      {
        question: "Où trouver les surgelés Hunkar à Calais ?",
        answer: "Chez Super Market Calais, qui propose les marques Hunkar et Idéal Délices en exclusivité.",
      },
      {
        question: "Combien de références de surgelés proposez-vous ?",
        answer: "Plus de 100 références : viandes, böreks et plats préparés.",
      },
    ],
  },
  {
    slug: "patisserie-orientale",
    title: "Pâtisserie orientale",
    heading: "Pâtisserie orientale à Calais",
    metaDescription:
      "Pâtisserie orientale à Calais : baklawas au miel et aux pistaches, cornes de gazelle et makrouts chez Super Market Calais, ouvert 7j/7.",
    summary: "Baklawas croustillants au miel et aux pistaches, cornes de gazelle et makrouts.",
    image: { src: "/categories/baklava-sample.jpg", alt: "Baklavas aux pistaches et au miel" },
    badge: "Gourmandise",
    highlights: ["Pur miel", "Artisanal"],
    paragraphs: [
      "Pour le thé, les fêtes ou les invités de dernière minute : notre rayon de pâtisserie orientale propose des baklawas croustillants au miel et aux pistaches, des cornes de gazelle et des makrouts.",
      "Des pâtisseries artisanales au pur miel, à accompagner d'un thé de notre rayon méditerranéen.",
    ],
    products: ["Baklawas au miel et aux pistaches", "Cornes de gazelle", "Makrouts"],
    faq: [
      {
        question: "Où acheter des baklawas à Calais ?",
        answer: "Chez Super Market Calais, au rayon pâtisserie orientale, ouvert 7 jours sur 7.",
      },
      {
        question: "Vos pâtisseries sont-elles au miel ?",
        answer: "Oui, nos pâtisseries orientales sont préparées au pur miel.",
      },
    ],
  },
  {
    slug: "fruits-legumes",
    title: "Fruits & légumes",
    heading: "Fruits et légumes frais à Calais",
    metaDescription:
      "Fruits et légumes frais à Calais : arrivages réguliers et produits de saison chez Super Market Calais, quartier Saint-Exupéry, ouvert 7j/7.",
    summary: "Arrivages réguliers de fruits savoureux et de légumes de saison.",
    image: { src: "/categories/fruits-legumes-sample.jpg", alt: "Étal de fruits et légumes frais" },
    badge: "Primeur",
    highlights: ["Produits de saison", "Fraîcheur garantie"],
    paragraphs: [
      "Notre rayon primeur est réapprovisionné régulièrement en fruits savoureux et en légumes de saison, pour cuisiner frais toute la semaine.",
      "Tout ce qu'il faut pour les salades, les tajines et les plats mijotés, à compléter avec les épices et la semoule du rayon méditerranéen.",
    ],
    products: ["Fruits de saison", "Légumes frais"],
    faq: [
      {
        question: "Les fruits et légumes arrivent-ils souvent ?",
        answer: "Oui, le rayon primeur reçoit des arrivages réguliers de produits de saison.",
      },
    ],
  },
  {
    slug: "epicerie",
    title: "Épicerie & produits frais",
    heading: "Épicerie et produits frais à Calais",
    metaDescription:
      "Épicerie à Calais : produits laitiers, conserves, épices du monde, riz, sauces et marques du quotidien chez Super Market Calais, ouvert 7j/7.",
    summary: "Produits laitiers, conserves, épices du monde, riz, sauces et toutes vos marques du quotidien.",
    image: { src: "/categories/epicerie-sample.jpg", alt: "Épices, huiles et condiments d'épicerie" },
    badge: "Essentiels",
    highlights: ["Large choix", "Épices du monde"],
    paragraphs: [
      "L'épicerie de quartier qui a tout : produits laitiers, conserves, riz, sauces, épices du monde et vos marques du quotidien, ouverte 7 jours sur 7.",
      "Pour les courses de dépannage comme pour le plein de la semaine, sans traverser la ville : le magasin est dans le quartier Saint-Exupéry, avec des places de stationnement gratuites devant l'entrée.",
    ],
    products: ["Produits laitiers", "Conserves", "Riz et féculents", "Sauces et condiments", "Épices du monde"],
    faq: [
      {
        question: "Le magasin fait-il épicerie de dépannage ?",
        answer: "Oui, il est ouvert 7 jours sur 7 avec toutes les marques du quotidien.",
      },
    ],
  },
];

export function departmentPath(slug: string): string {
  return `/rayons/${slug}`;
}

export function findDepartment(slug: string): Department | undefined {
  return DEPARTMENTS.find((department) => department.slug === slug);
}
