'use server';

import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAppSettings, updateAppSettings, resetAppSettings } from "@/lib/settings/service";
import { AppSettings } from "@/lib/settings/types";

/**
 * Server Action: Fetches current application settings for authenticated ADMIN.
 */
export async function getSettingsAction() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé. Veuillez vous connecter." };
  }

  const role = user.user_metadata?.role || "CUSTOMER";
  if (role !== "ADMIN") {
    return { success: false, error: "Accès refusé. Seuls les administrateurs peuvent accéder à la configuration." };
  }

  const settings = await getAppSettings();
  return { success: true, settings };
}

/**
 * Server Action: Updates application settings (Strict ADMIN access only).
 */
export async function updateSettingsAction(data: AppSettings) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé. Veuillez vous connecter." };
  }

  const role = user.user_metadata?.role || "CUSTOMER";
  if (role !== "ADMIN") {
    return { success: false, error: "Accès refusé. Réservé aux administrateurs." };
  }

  const adminEmail = user.email || "Administrateur";
  const result = await updateAppSettings(data, adminEmail);

  if (result.success) {
    // Invalidate cached pages and root layouts that consume store / loyalty configurations
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

  return result;
}

/**
 * Server Action: Resets application settings to default constants (Strict ADMIN access only).
 */
export async function resetSettingsAction(): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé. Veuillez vous connecter." };
  }

  const role = user.user_metadata?.role || "CUSTOMER";
  if (role !== "ADMIN") {
    return { success: false, error: "Accès refusé. Réservé aux administrateurs." };
  }

  const adminEmail = user.email || "Administrateur";
  const result = await resetAppSettings(adminEmail);

  revalidatePath("/admin/settings");
  revalidatePath("/account/loyalty");
  revalidatePath("/account");
  revalidatePath("/cashier/pos");
  revalidatePath("/cashier");
  revalidatePath("/admin");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/invite");
  revalidatePath("/", "layout");

  return { success: true, settings: result.settings };
}
