import { z } from "zod";

/**
 * Zod schema for customer creation
 */
export const CreateCustomerSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères."),
  last_name: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères."),
  email: z.string().trim().email("Adresse email invalide."),
  phone: z.string().trim().min(8, "Le numéro de téléphone doit comporter au moins 8 caractères."),
});

export type CreateCustomerPayload = z.infer<typeof CreateCustomerSchema>;

/**
 * Zod schema for recording a purchase
 */
export const RecordPurchaseSchema = z.object({
  amount: z
    .number({ message: "Le montant doit être un nombre valide." })
    .positive("Le montant de l'achat doit être strictement supérieur à 0 €."),
});

export type RecordPurchasePayload = z.infer<typeof RecordPurchaseSchema>;

/**
 * Zod schema for redeeming loyalty points
 */
export const RedeemPointsSchema = z.object({
  points: z
    .number({ message: "Les points doivent être un nombre entier." })
    .int("Les points doivent être un entier.")
    .positive("Le nombre de points à déduire doit être strictement supérieur à 0."),
  amount: z
    .number({ message: "Le montant de l'achat doit être un nombre." })
    .min(0, "Le montant de l'achat ne peut pas être négatif.")
    .default(0),
  reason: z.string().trim().optional(),
});

export type RedeemPointsPayload = z.infer<typeof RedeemPointsSchema>;
