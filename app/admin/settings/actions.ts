'use server';

import { revalidatePath } from "next/cache";
import { getSessionCaller } from "@/lib/auth/session";
import { getAppSettings, updateAppSettings, resetAppSettings } from "@/lib/settings/service";
import { AppSettings } from "@/lib/settings/types";

const UNAUTHENTICATED_MESSAGE = "Non autorisé. Veuillez vous connecter.";

/** Pages and layouts that consume store / loyalty configuration. */
function revalidateSettingsConsumers() {
  revalidatePath("/admin/settings");
  revalidatePath("/account/loyalty");
  revalidatePath("/account");
  revalidatePath("/cashier/pos");
  revalidatePath("/cashier");
  revalidatePath("/admin");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/invite");
  revalidatePath("/", "layout");
}

/**
 * Server Action: Fetches current application settings for authenticated ADMIN.
 */
export async function getSettingsAction() {
  const caller = await getSessionCaller(["ADMIN"]);
  if (!caller.ok) {
    return {
      success: false,
      error: caller.reason === "UNAUTHENTICATED"
        ? UNAUTHENTICATED_MESSAGE
        : "Accès refusé. Seuls les administrateurs peuvent accéder à la configuration.",
    };
  }

  const settings = await getAppSettings();
  return { success: true, settings };
}

/**
 * Server Action: Updates application settings (Strict ADMIN access only).
 * The payload is validated with AppSettingsSchema inside `updateAppSettings`.
 */
export async function updateSettingsAction(data: AppSettings) {
  const caller = await getSessionCaller(["ADMIN"]);
  if (!caller.ok) {
    return {
      success: false,
      error: caller.reason === "UNAUTHENTICATED" ? UNAUTHENTICATED_MESSAGE : "Accès refusé. Réservé aux administrateurs.",
    };
  }

  const adminEmail = caller.user.email || "Administrateur";
  const result = await updateAppSettings(data, adminEmail);

  if (result.success) {
    revalidateSettingsConsumers();
  }

  return result;
}

/**
 * Server Action: Resets application settings to default constants (Strict ADMIN access only).
 */
export async function resetSettingsAction(): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
  const caller = await getSessionCaller(["ADMIN"]);
  if (!caller.ok) {
    return {
      success: false,
      error: caller.reason === "UNAUTHENTICATED" ? UNAUTHENTICATED_MESSAGE : "Accès refusé. Réservé aux administrateurs.",
    };
  }

  const adminEmail = caller.user.email || "Administrateur";
  const result = await resetAppSettings(adminEmail);

  revalidateSettingsConsumers();

  return { success: true, settings: result.settings };
}
