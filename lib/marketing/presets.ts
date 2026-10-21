import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import type { LoyaltyTier } from "@/lib/loyalty/types";
import { getSiteUrl } from "@/lib/utils/app-url";

/**
 * Campaign editor content: tier choices, ready-made campaigns and the default draft.
 * Kept out of the component so texts and defaults change in one place (AGENTS.md § 7).
 */

const TIER_AUDIENCE: Record<LoyaltyTier, string> = {
  BRONZE: "Nouveaux clients & achats réguliers",
  SILVER: "Clients fréquents",
  GOLD: "Clients fidèles",
  VIP: "Clients premium",
};

/** Audience choices of step 1; thresholds come from the loyalty configuration. */
export const CAMPAIGN_TIER_OPTIONS: { id: LoyaltyTier; label: string; desc: string }[] = (
  Object.keys(TIER_AUDIENCE) as LoyaltyTier[]
).map((id) => {
  const { label, minHistoricalPoints } = LOYALTY_CONFIG.tiers[id];
  return {
    id,
    label,
    desc:
      minHistoricalPoints > 0
        ? `${TIER_AUDIENCE[id]} (+${minHistoricalPoints.toLocaleString("fr-FR")} pts)`
        : TIER_AUDIENCE[id],
  };
});

/** Starting point of a new campaign (and of "Effacer"). */
export const DEFAULT_CAMPAIGN_DRAFT = {
  tiers: ["GOLD", "VIP"] as readonly LoyaltyTier[],
  dispatchMode: "ALL_AT_ONCE" as "ALL_AT_ONCE" | "DAILY_LIMIT",
  dailyLimit: "50",
  title: "Offres Exclusives Fidélité",
  subject: "🔥 Vos bons plans de la semaine chez Super Market Calais !",
  content:
    "Profitez de nos offres exceptionnelles dès aujourd'hui dans votre magasin.\n\n- Remises exclusives sur une large sélection de produits frais\n- Points fidélité doublés sur votre passage en caisse\n- Dégustations et surprises au rayon primeurs\n\nPrésentez simplement votre nom ou numéro en caisse pour en bénéficier.",
  imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" as string | null,
  ctaText: "Découvrir les offres en magasin",
  ctaUrl: getSiteUrl(),
};

/** Ready-made campaigns of step 3 ("Modèles"). */
export const CAMPAIGN_PRESETS = [
  {
    name: "🥦 Primeurs & -20% Frais",
    title: "Arrivage Primeurs Frais & -20% Week-end",
    subject: "🔥 Bonnes Affaires : -20% sur les Primeurs et Points Doublés ce week-end !",
    content: `Profitez de nos offres fraîches exclusives dès ce vendredi dans votre magasin Super Market Calais !\n\n- 20% de remise immédiate sur l'ensemble du rayon fruits & légumes dès 25€ d'achat\n- Vos points fidélité sont doublés sur tout votre ticket de caisse\n- Dégustation gratuite de nos nouveaux arrivages locaux ce samedi matin\n\nOffre exclusive réservée à nos membres fidélité sur simple indication de votre nom ou numéro de téléphone lors de votre passage au comptoir caisse.`,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Découvrir les offres en magasin",
    ctaUrl: getSiteUrl(),
  },
  {
    name: "🍗 Poulet Frais & Charcuterie",
    title: "Poulet Frais en Barquette & Charcuterie",
    subject: "🍗 Poulet frais 100% Halal : arrivage du jour et points doublés ce week-end !",
    content: `Profitez de notre arrivage quotidien de poulet frais en barquette dans votre magasin Super Market Calais :\n\n- Filets, cuisses, ailes et pilons de poulet frais 100% Halal, prêts à cuisiner\n- Notre sélection de charcuterie traditionnelle\n- Points fidélité doublés sur le rayon poulet frais & charcuterie dès 30€ d'achat\n\nIndiquez simplement votre numéro de téléphone en caisse pour activer vos réductions fidélité !`,
    imageUrl: `${getSiteUrl()}/categories/poulet-frais-sample.jpg`,
    ctaText: "Découvrir le rayon poulet frais",
    ctaUrl: getSiteUrl(),
  },
  {
    name: "🌙 Saveurs d'Orient & Épicerie",
    title: "Sélection Saveurs d'Orient & Épicerie du Monde",
    subject: "✨ Arrivage Épicerie : Dattes Medjool, Épices & Spécialités d'Orient en promo !",
    content: `Découvrez notre nouvelle sélection d'épicerie orientale et de produits authentiques chez Super Market Calais :\n\n- 15% de remise sur nos dattes Medjool premium, fruits secs et graines\n- Sélection d'épices parfumées, thés à la menthe et douceurs traditionnelles\n- 100 points fidélité bonus crédités instantanément dès 35€ d'achat\n\nRendez-vous dès aujourd'hui en magasin pour savourer nos arrivages exclusifs !`,
    imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Voir les arrivages en magasin",
    ctaUrl: getSiteUrl(),
  },
  {
    name: "⚡ Ventes Flash x3 Points",
    title: "Journées Privilège : Points Fidélité Triplés",
    subject: "⚡ Ventes Flash : Multipliez vos points par 3 sur tout le magasin !",
    content: `Ce week-end seulement, transformez vos courses en avalanche de points fidélité !\n\n- Tous vos achats vous rapportent 3 fois plus de points en caisse\n- Débloquez instantanément vos prochains bons d'achat de 5€ et 10€\n- Accès prioritaire à notre comptoir caisse pour les membres Silver, Gold et VIP\n\nN'oubliez pas d'indiquer vos coordonnées à notre hôte(sse) de caisse avant la fin de votre encaissement.`,
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Voir mon solde de points fidélité",
    ctaUrl: getSiteUrl(),
  },
  {
    name: "❄️ Surgelés Hunkar & Idéal Délices",
    title: "Rayon Surgelés : +100 Références & Exclusivités",
    subject: "❄️ Arrivage Surgelés : Hunkar & Idéal Délices en exclusivité à prix cassés !",
    content: `Découvrez notre rayon surgelés avec plus de 100 références à prix imbattables dans votre magasin Super Market Calais :\n\n- En exclusivité : toute la gamme de spécialités des marques Hunkar et Idéal Délices\n- Plats préparés, viandes surgelées, légumes et délices prêts à cuisiner\n- Points fidélité doublés sur tout le rayon surgelés dès 20€ d'achat\n\nRemplissez votre congélateur sans compromis sur la qualité ni sur votre budget !`,
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Découvrir le rayon surgelés",
    ctaUrl: getSiteUrl(),
  },
  {
    name: "🥤 Boissons Pack N°1 Calais",
    title: "N°1 des Boissons en Pack à Calais : +60 Références",
    subject: "🥤 Spécial Boissons : Le N°1 en pack sur Calais vous régale à petits prix !",
    content: `Super Market Calais est votre destination numéro 1 pour les boissons en pack sur Calais !\n\n- Plus de 60 références disponibles en stock permanent : sodas, jus, eaux gazeuses et thés glacés\n- Prix dégressifs et promos sur les packs familiaux\n- 50 points fidélité offerts dès 3 packs achetés\n\nFaites le plein de fraîcheur au meilleur prix de la région !`,
    imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Voir les offres boissons",
    ctaUrl: getSiteUrl(),
  },
];
