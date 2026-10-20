import { z } from "zod";
import { DEFAULT_APP_SETTINGS } from "./types";
import { OPENING_HOURS_LIMITS } from "@/lib/store/config";
import { DAY_NAMES, type DayIndex } from "@/lib/store/opening-hours";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" that is a real calendar day (rejects 2026-02-30). */
const isoDate = (message: string) =>
  z
    .string()
    .regex(DATE_PATTERN, message)
    .refine((value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value), message);

/** Opening ranges of one day: valid times, close after open, sorted and not overlapping. */
function dayRangesSchema(day: DayIndex) {
  const name = DAY_NAMES[day];
  return z
    .array(
      z
        .object({
          open: z.string().regex(TIME_PATTERN, `${name} : heure d'ouverture invalide (format HH:MM).`),
          close: z.string().regex(TIME_PATTERN, `${name} : heure de fermeture invalide (format HH:MM).`),
        })
        .refine((range) => range.open < range.close, {
          message: `${name} : l'heure de fermeture doit être après l'heure d'ouverture.`,
        })
    )
    .max(OPENING_HOURS_LIMITS.maxRangesPerDay, `${name} : au maximum ${OPENING_HOURS_LIMITS.maxRangesPerDay} plages horaires.`)
    .refine((ranges) => ranges.every((range, i) => i === 0 || ranges[i - 1].close <= range.open), {
      message: `${name} : les plages horaires doivent se suivre sans se chevaucher.`,
    });
}

export const OpeningHoursSchema = z.object({
  weekly: z.object({
    0: dayRangesSchema(0),
    1: dayRangesSchema(1),
    2: dayRangesSchema(2),
    3: dayRangesSchema(3),
    4: dayRangesSchema(4),
    5: dayRangesSchema(5),
    6: dayRangesSchema(6),
  }),
  closures: z
    .array(
      z
        .object({
          id: z.string().trim().min(1).max(64),
          startDate: isoDate("Fermeture exceptionnelle : date de début invalide."),
          endDate: isoDate("Fermeture exceptionnelle : date de fin invalide."),
          reason: z
            .string()
            .trim()
            .max(
              OPENING_HOURS_LIMITS.maxClosureReasonLength,
              `Le motif de fermeture ne doit pas dépasser ${OPENING_HOURS_LIMITS.maxClosureReasonLength} caractères.`
            )
            .default(""),
        })
        .refine((closure) => closure.startDate <= closure.endDate, {
          message: "Fermeture exceptionnelle : la date de fin doit être égale ou postérieure à la date de début.",
        })
    )
    .max(OPENING_HOURS_LIMITS.maxClosures, `Au maximum ${OPENING_HOURS_LIMITS.maxClosures} fermetures exceptionnelles.`),
});

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
    tagline: z.string().trim().max(150, "Le sous-titre ne doit pas dépasser 150 caractères.").default(""),
    address: z.string().trim().max(255, "L'adresse ne doit pas dépasser 255 caractères.").default(""),
    phone: z.string().trim().max(30, "Le numéro de téléphone ne doit pas dépasser 30 caractères.").default(""),
    email: z
      .string()
      .trim()
      .email("L'adresse email du magasin est invalide.")
      .or(z.literal(""))
      .default(""),
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
  // Settings saved before opening hours were editable have no `hours` section
  hours: OpeningHoursSchema.default(DEFAULT_APP_SETTINGS.hours),
});

export type AppSettingsInput = z.infer<typeof AppSettingsSchema>;
