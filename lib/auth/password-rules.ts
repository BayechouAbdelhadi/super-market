import { z } from "zod";

/**
 * Standard password security criteria definitions
 */
export interface PasswordCriterion {
  id: "minLength" | "hasUppercase" | "hasLowercase" | "hasNumber" | "hasSpecial";
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_CRITERIA: PasswordCriterion[] = [
  {
    id: "minLength",
    label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    test: (p: string) => (p || "").length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "hasUppercase",
    label: "Au moins une lettre majuscule (A-Z)",
    test: (p: string) => /[A-Z]/.test(p || ""),
  },
  {
    id: "hasLowercase",
    label: "Au moins une lettre minuscule (a-z)",
    test: (p: string) => /[a-z]/.test(p || ""),
  },
  {
    id: "hasNumber",
    label: "Au moins un chiffre (0-9)",
    test: (p: string) => /[0-9]/.test(p || ""),
  },
  {
    id: "hasSpecial",
    label: "Au moins un caractère spécial (@, #, $, !, %, etc.)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p || ""),
  },
];

/**
 * Evaluates password string against all criteria
 */
export function evaluatePasswordCriteria(password: string) {
  const pwd = password || "";
  const results = PASSWORD_CRITERIA.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    satisfied: criterion.test(pwd),
  }));

  const metCount = results.filter((r) => r.satisfied).length;
  const totalCount = PASSWORD_CRITERIA.length;
  const isComplete = metCount === totalCount;

  return {
    results,
    metCount,
    totalCount,
    isComplete,
  };
}

/**
 * Zod schema enforcing strong password criteria with localized human-readable errors
 */
export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit comporter au moins ${PASSWORD_MIN_LENGTH} caractères.`)
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule (A-Z).")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule (a-z).")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre (0-9).")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (ex: @, #, $, !, %).");
