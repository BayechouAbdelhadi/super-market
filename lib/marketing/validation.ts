import { z } from "zod";

export const CreateCampaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Le titre de la campagne doit contenir au moins 3 caractères.")
      .max(120, "Le titre ne doit pas dépasser 120 caractères."),
    targetTiers: z
      .array(z.enum(["BRONZE", "SILVER", "GOLD", "VIP"]))
      .min(1, "Veuillez sélectionner au moins une catégorie de clients (palier)."),
    dispatchMode: z.enum(["ALL_AT_ONCE", "DAILY_LIMIT"]),
    dailyLimit: z
      .number()
      .int()
      .positive("La limite quotidienne doit être supérieure à 0.")
      .max(10000, "La limite maximale est de 10 000 par jour.")
      .nullable()
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date de début invalide (AAAA-MM-JJ)."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date de fin invalide (AAAA-MM-JJ)."),
    subject: z
      .string()
      .trim()
      .min(3, "L'objet de l'email doit comporter au moins 3 caractères.")
      .max(150, "L'objet ne doit pas dépasser 150 caractères."),
    content: z
      .string()
      .trim()
      .min(10, "Le contenu de l'offre doit comporter au moins 10 caractères."),
    imageUrl: z
      .string()
      .trim()
      .url("L'URL de l'image est invalide.")
      .nullable()
      .optional()
      .or(z.literal("")),
    ctaText: z.string().trim().max(40).optional(),
    ctaUrl: z.string().trim().url("L'URL du lien est invalide.").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.dispatchMode === "DAILY_LIMIT") {
        return typeof data.dailyLimit === "number" && data.dailyLimit > 0;
      }
      return true;
    },
    {
      message: "Veuillez renseigner un quota de clients par jour supérieur à 0.",
      path: ["dailyLimit"],
    }
  )
  .refine(
    (data) => {
      return data.endDate >= data.startDate;
    },
    {
      message: "La date de fin doit être postérieure ou égale à la date de début.",
      path: ["endDate"],
    }
  );

export type CreateCampaignSchemaType = z.infer<typeof CreateCampaignSchema>;
