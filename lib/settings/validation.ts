import { z } from "zod";

export const AppSettingsSchema = z.object({
  loyalty: z.object({
    pointValueInEuro: z
      .number({ message: "La valeur du point doit être un nombre." })
      .min(0.001, "La valeur du point doit être d'au moins 0.001 €.")
      .max(1.0, "La valeur du point ne peut pas dépasser 1.00 €."),
    euroToPointsRatio: z
      .number({ message: "Le ratio doit être un nombre." })
      .min(0.1, "Le ratio doit être d'au moins 0.1 point par euro.")
      .max(50, "Le ratio ne peut pas dépasser 50 points par euro."),
    minPointsToRedeem: z
      .number({ message: "Le seuil minimum doit être un entier." })
      .int("Le seuil minimum de points doit être un nombre entier.")
      .min(0, "Le seuil de points doit être positif ou nul."),
    maxDiscountPerTransactionEuro: z
      .number({ message: "La remise maximale doit être un nombre." })
      .min(0, "La remise maximale doit être positive ou nulle (0 = illimitée)."),
    tierSilverMinPoints: z
      .number()
      .int()
      .min(1, "Le seuil Silver doit être supérieur à 0."),
    tierGoldMinPoints: z
      .number()
      .int()
      .min(1, "Le seuil Gold doit être supérieur à 0."),
    tierVipMinPoints: z
      .number()
      .int()
      .min(1, "Le seuil VIP doit être supérieur à 0."),
  }).refine((data) => data.tierSilverMinPoints < data.tierGoldMinPoints, {
    message: "Le seuil Gold doit être strictement supérieur au seuil Silver.",
    path: ["tierGoldMinPoints"],
  }).refine((data) => data.tierGoldMinPoints < data.tierVipMinPoints, {
    message: "Le seuil VIP doit être strictement supérieur au seuil Gold.",
    path: ["tierVipMinPoints"],
  }),
  pos: z.object({
    defaultCashierStation: z
      .string()
      .trim()
      .min(1, "Le nom de la caisse par défaut est requis.")
      .max(50, "Le nom de la caisse ne doit pas dépasser 50 caractères."),
    quickPurchaseAmounts: z
      .array(z.number().positive("Les montants rapides doivent être supérieurs à 0."))
      .min(1, "Au moins un montant d'achat rapide est requis.")
      .max(8, "Au maximum 8 raccourcis de montants sont acceptés."),
    quickRedeemPoints: z
      .array(z.number().int().positive("Les points rapides doivent être supérieurs à 0."))
      .min(1, "Au moins un raccourci de points est requis.")
      .max(8, "Au maximum 8 raccourcis de points sont acceptés."),
    defaultRedeemReason: z
      .string()
      .trim()
      .min(1, "Le motif par défaut est requis.")
      .max(100, "Le motif ne doit pas dépasser 100 caractères."),
  }),
  store: z.object({
    storeName: z
      .string()
      .trim()
      .min(2, "Le nom du magasin doit comporter au moins 2 caractères.")
      .max(100, "Le nom du magasin ne doit pas dépasser 100 caractères."),
    tagline: z.string().trim().max(150, "Le sous-titre ne doit pas dépasser 150 caractères."),
    address: z.string().trim().max(255, "L'adresse ne doit pas dépasser 255 caractères."),
    phone: z.string().trim().max(30, "Le numéro de téléphone ne doit pas dépasser 30 caractères."),
    email: z.string().trim().email("L'adresse email du magasin est invalide."),
  }),
  notifications: z.object({
    senderEmail: z
      .string()
      .trim()
      .email("L'adresse email d'envoi des notifications est invalide.")
      .default("notifications@supermarket-calais.fr"),
    senderName: z
      .string()
      .trim()
      .max(100, "Le nom de l'expéditeur ne doit pas dépasser 100 caractères.")
      .default("Super Market Calais"),
    sendWelcomeEmail: z.boolean(),
    sendCashierInviteEmail: z.boolean(),
  }),
});

export type AppSettingsInput = z.infer<typeof AppSettingsSchema>;
