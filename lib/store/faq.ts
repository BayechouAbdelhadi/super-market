import { STORE_ACCESS, STORE_PAYMENT_METHODS, STORE_PICKUP_CARRIERS } from "./config";
import { formatDayHours, groupWeek, isOpenEveryDay, type WeeklySchedule } from "./opening-hours";

export interface FaqItem {
  question: string;
  answer: string;
}

const listFormatter = new Intl.ListFormat("fr-FR", { style: "long", type: "conjunction" });

/** ["carte bancaire", "Apple Pay", "espèces"] → "Carte bancaire, Apple Pay et espèces". */
export function formatList(items: readonly string[]): string {
  const text = listFormatter.format(items);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface FaqFacts {
  storeName: string;
  address: string;
  weekly: WeeklySchedule;
  euroToPointsRatio: number;
}

/**
 * Questions customers ask, answered from the live settings (hours, address, loyalty ratio) so the
 * FAQ never contradicts the rest of the site. Shown on the home page and sent as FAQPage data.
 */
export function buildStoreFaq({ storeName, address, weekly, euroToPointsRatio }: FaqFacts): FaqItem[] {
  const hours = groupWeek(weekly)
    .map((group) => `${group.days} : ${group.hours}`)
    .join(" ; ");
  const sunday = weekly[0];
  const points = `${euroToPointsRatio} point${euroToPointsRatio > 1 ? "s" : ""}`;

  return [
    {
      question: `Quels sont les horaires de ${storeName} ?`,
      answer: `${isOpenEveryDay(weekly) ? "Le magasin est ouvert 7 jours sur 7. " : ""}${hours}. Les fermetures exceptionnelles sont annoncées sur le site.`,
    },
    {
      question: "Le magasin est-il ouvert le dimanche ?",
      answer:
        sunday.length > 0
          ? `Oui, le dimanche de ${formatDayHours(sunday).replace(/ – /g, " à ")}.`
          : "Non, le magasin est fermé le dimanche.",
    },
    {
      question: `Où se trouve ${storeName} ?`,
      answer: `Au ${address} (${STORE_ACCESS.landmark.toLowerCase()}). ${STORE_ACCESS.transport}.`,
    },
    {
      question: "Peut-on se garer devant le magasin ?",
      answer: `Oui : ${STORE_ACCESS.parking.charAt(0).toLowerCase()}${STORE_ACCESS.parking.slice(1)}.`,
    },
    {
      question: "Le poulet est-il halal ?",
      answer: "Oui, nos volailles fraîches (filets, cuisses, ailes et pilons en barquette) sont 100 % halal, avec un arrivage quotidien.",
    },
    {
      question: "Trouve-t-on des produits turcs et marocains ?",
      answer:
        "Oui, c'est notre spécialité : huiles d'olive, olives, épices, semoule, thés, conserves, surgelés Hunkar et Idéal Délices, et pâtisseries orientales.",
    },
    {
      question: "Peut-on retirer ou déposer un colis ?",
      answer: `Oui, le magasin est un point relais Pickup : déposez et retirez vos colis ${STORE_PICKUP_CARRIERS}.`,
    },
    {
      question: "Quels moyens de paiement sont acceptés ?",
      answer: `${formatList(STORE_PAYMENT_METHODS)}.`,
    },
    {
      question: "Comment fonctionne la carte de fidélité ?",
      answer: `Pas besoin de carte : donnez votre nom ou votre numéro de téléphone en caisse. Chaque euro dépensé vous rapporte ${points}, à utiliser ensuite en réduction sur vos courses.`,
    },
  ];
}
