import type { AuthFailureCode } from "./ports";

/** User-facing French messages for account creation failures (raw auth-server text is never shown). */
const AUTH_FAILURE_MESSAGES: Record<AuthFailureCode, string> = {
  EMAIL_TAKEN: "Un compte existe déjà avec cette adresse email.",
  WEAK_PASSWORD: "Le mot de passe est trop faible. Choisissez un mot de passe plus robuste.",
  INVALID_EMAIL: "L'adresse email est invalide.",
  RATE_LIMITED: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  UNKNOWN: "Erreur lors de la création du compte.",
};

export function authFailureMessage(code: AuthFailureCode): string {
  return AUTH_FAILURE_MESSAGES[code];
}
