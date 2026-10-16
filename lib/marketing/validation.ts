import { z } from "zod";

export const CreateCampaignSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Le titre de la campagne est requis.")
      .max(120, "Le titre ne doit pas dépasser 120 caractères."),
    status: z.enum(["DRAFT", "SCHEDULED", "RUNNING"]).optional(),
    targetTiers: z
      .array(z.enum(["BRONZE", "SILVER", "GOLD", "VIP"]))
      .default(["BRONZE", "SILVER", "GOLD", "VIP"]),
    dispatchMode: z.enum(["ALL_AT_ONCE", "DAILY_LIMIT"]).default("ALL_AT_ONCE"),
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
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM).")
      .default("00:00")
      .optional(),
    subject: z
      .string()
      .trim()
      .max(150, "L'objet ne doit pas dépasser 150 caractères.")
      .default(""),
    content: z
      .string()
      .trim()
      .default(""),
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
      if (data.status === "DRAFT") return true;
      return data.title.trim().length >= 3;
    },
    {
      message: "Le titre de la campagne doit contenir au moins 3 caractères.",
      path: ["title"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "DRAFT") return true;
      return data.targetTiers.length >= 1;
    },
    {
      message: "Veuillez sélectionner au moins une catégorie de clients (palier).",
      path: ["targetTiers"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "DRAFT" && data.dailyLimit === undefined) return true;
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
      if (data.status === "DRAFT") return true;
      return data.endDate >= data.startDate;
    },
    {
      message: "La date de fin doit être postérieure ou égale à la date de début.",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "DRAFT") return true;
      return data.subject.trim().length >= 3;
    },
    {
      message: "L'objet de l'email doit comporter au moins 3 caractères.",
      path: ["subject"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "DRAFT") return true;
      return data.content.trim().length >= 10;
    },
    {
      message: "Le contenu de l'offre doit comporter au moins 10 caractères.",
      path: ["content"],
    }
  );

export type CreateCampaignSchemaType = z.infer<typeof CreateCampaignSchema>;
