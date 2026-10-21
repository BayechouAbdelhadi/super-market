import { z } from "zod";
import { ALERTS_CONFIG } from "./config";
import { ALERT_LEVELS } from "./types";

export const CreateAlertSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Le message est obligatoire.")
    .max(ALERTS_CONFIG.messageMaxLength, `Le message ne doit pas dépasser ${ALERTS_CONFIG.messageMaxLength} caractères.`),
  level: z.enum(ALERT_LEVELS, { message: "Niveau d'alerte invalide." }),
});

export const UpdateAlertSchema = z.object({
  isActive: z.boolean({ message: "La visibilité doit être vraie ou fausse." }),
});

export const AlertIdSchema = z.string().uuid("Identifiant d'alerte invalide.");

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
