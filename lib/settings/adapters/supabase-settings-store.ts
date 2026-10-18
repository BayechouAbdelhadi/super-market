import { ISettingsStore, StoredSettings } from "../ports";
import { AppSettings } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";

const SETTINGS_ROW_ID = "current";

/**
 * Infrastructure Adapter: settings stored in the Supabase `app_settings` table (primary store).
 */
export class SupabaseSettingsStore implements ISettingsStore {
  async load(): Promise<StoredSettings | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("settings_json, updated_at, updated_by")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();

    if (error || !data?.settings_json) {
      return null;
    }
    return { settings: data.settings_json, updatedAt: data.updated_at, updatedBy: data.updated_by };
  }

  async save(settings: AppSettings): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from("app_settings").upsert(
      {
        id: SETTINGS_ROW_ID,
        settings_json: settings,
        updated_at: settings.updatedAt,
        updated_by: settings.updatedBy,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("[AppSettings] Supabase upsert error:", error.message);
    }
  }
}
