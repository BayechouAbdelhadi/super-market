import { z } from "zod";
import { ARRIVALS_CONFIG, ARRIVAL_PRODUCTS } from "./config";
import { storeDay, unitLabelFor } from "./domain";
import { ARRIVAL_CATEGORIES, RESERVATION_STATUSES, STAFF_RESERVATION_STATUSES } from "./types";

const C = ARRIVALS_CONFIG;

export const ArrivalIdSchema = z.string().uuid("Identifiant d'arrivage invalide.");
export const ReservationIdSchema = z.string().uuid("Identifiant de réservation invalide.");

const ArrivalItemSchema = z.object({
  id: z.string().uuid("Identifiant d'article invalide.").optional(),
  // Checked against the category's products in ArrivalSchema
  name: z.string().trim().min(1, "Le nom de l'article est obligatoire."),
  weightGrams: z
    .number({ message: "Le poids doit être un nombre." })
    .int("Le poids doit être un nombre entier de grammes.")
    .min(C.minWeightGrams, `Le poids d'une barquette doit être d'au moins ${C.minWeightGrams} g.`)
    .max(C.maxWeightGrams, `Le poids d'une barquette ne doit pas dépasser ${C.maxWeightGrams} g.`),
  unitPrice: z
    .number({ message: "Le prix doit être un nombre." })
    .positive("Le prix doit être supérieur à 0.")
    .max(C.maxUnitPrice, `Le prix ne doit pas dépasser ${C.maxUnitPrice} €.`)
    .transform((v) => Math.round(v * 100) / 100),
  stockTotal: z
    .number({ message: "Le stock doit être un nombre." })
    .int("Le stock doit être un nombre entier.")
    .min(0, "Le stock ne peut pas être négatif.")
    .max(C.maxStock, `Le stock ne doit pas dépasser ${C.maxStock}.`),
  maxPerCustomer: z
    .number({ message: "La limite par client doit être un nombre." })
    .int("La limite par client doit être un nombre entier.")
    .positive("La limite par client doit être supérieure à 0.")
    .nullable(),
}).transform((item) => ({ ...item, unitLabel: unitLabelFor(item.weightGrams) }));

export const ArrivalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Le titre est obligatoire.")
      .max(C.titleMaxLength, `Le titre ne doit pas dépasser ${C.titleMaxLength} caractères.`),
    description: z
      .string()
      .trim()
      .max(C.descriptionMaxLength, `La description ne doit pas dépasser ${C.descriptionMaxLength} caractères.`)
      .nullable()
      .transform((v) => v || null),
    category: z.enum(ARRIVAL_CATEGORIES, { message: "Catégorie invalide." }).default(C.defaultCategory),
    reservationOpensAt: z.string().datetime({ offset: true, message: "Date d'ouverture invalide." }),
    reservationClosesAt: z.string().datetime({ offset: true, message: "Date de clôture invalide." }),
    pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'arrivage invalide."),
    items: z
      .array(ArrivalItemSchema)
      .min(1, "Ajoutez au moins un article.")
      .max(C.maxItems, `Un arrivage ne peut pas avoir plus de ${C.maxItems} articles.`),
  })
  .refine((a) => new Date(a.reservationOpensAt) < new Date(a.reservationClosesAt), {
    message: "La clôture des réservations doit être après leur ouverture.",
    path: ["reservationClosesAt"],
  })
  .refine((a) => a.pickupDate >= storeDay(new Date(a.reservationClosesAt)), {
    message: "Le jour de l'arrivage ne peut pas être avant la clôture des réservations.",
    path: ["pickupDate"],
  })
  .refine((a) => a.items.every((i) => ARRIVAL_PRODUCTS[a.category].includes(i.name)), {
    message: "Un article ne fait pas partie des produits de cette catégorie.",
    path: ["items"],
  })
  .refine((a) => new Set(a.items.map((i) => i.name)).size === a.items.length, {
    message: "Un produit apparaît deux fois.",
    path: ["items"],
  })
  .refine((a) => new Set(a.items.filter((i) => i.id).map((i) => i.id)).size === a.items.filter((i) => i.id).length, {
    message: "Un article apparaît deux fois.",
    path: ["items"],
  });

export const CreateReservationSchema = z.object({
  lines: z
    .array(
      z.object({
        itemId: z.string().uuid("Article invalide."),
        quantity: z
          .number({ message: "Quantité invalide." })
          .int("La quantité doit être un nombre entier.")
          .min(1, "La quantité doit être d'au moins 1.")
          .max(C.maxQuantityPerLine, `La quantité ne doit pas dépasser ${C.maxQuantityPerLine}.`),
      })
    )
    .min(1, "Choisissez au moins un article.")
    .max(C.maxItems, "Trop d'articles dans la réservation."),
});

export const UpdateReservationStatusSchema = z.object({
  status: z.enum(STAFF_RESERVATION_STATUSES, { message: "Statut de réservation invalide." }),
});

export const ReservationStatusFilterSchema = z.enum(RESERVATION_STATUSES).nullable().catch(null);

export type ArrivalInput = z.infer<typeof ArrivalSchema>;
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
