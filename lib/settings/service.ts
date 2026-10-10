import fs from "fs";
import path from "path";
import { AppSettings, DEFAULT_APP_SETTINGS } from "./types";
import { AppSettingsSchema } from "./validation";
import { createAdminClient } from "@/lib/supabase/admin";

const SETTINGS_FILE_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE_PATH = path.join(SETTINGS_FILE_DIR, "app-settings.json");

let memoryCache: AppSettings | null = null;

/**
 * Loads current application settings.
 * Priority: In-Memory Cache -> File System Store -> Supabase Table -> Defaults
 */
export async function getAppSettings(): Promise<AppSettings> {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. Try file system storage first
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      const validated = AppSettingsSchema.safeParse(parsed);
      if (validated.success) {
        memoryCache = {
          ...DEFAULT_APP_SETTINGS,
          ...validated.data,
          loyalty: { ...DEFAULT_APP_SETTINGS.loyalty, ...validated.data.loyalty },
          pos: { ...DEFAULT_APP_SETTINGS.pos, ...validated.data.pos },
          store: { ...DEFAULT_APP_SETTINGS.store, ...validated.data.store },
          notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...validated.data.notifications },
          updatedAt: parsed.updatedAt,
          updatedBy: parsed.updatedBy,
        };
        return memoryCache;
      }
    }
  } catch (err) {
    console.warn("[AppSettings] Failed to read from file storage, falling back:", err);
  }

  // 2. Try Supabase app_settings table if configured
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("settings_json, updated_at, updated_by")
      .eq("id", "current")
      .maybeSingle();

    if (!error && data?.settings_json) {
      const validated = AppSettingsSchema.safeParse(data.settings_json);
      if (validated.success) {
        memoryCache = {
          ...DEFAULT_APP_SETTINGS,
          ...validated.data,
          updatedAt: data.updated_at,
          updatedBy: data.updated_by,
        };
        // Persist to file store for speed
        try {
          if (!fs.existsSync(SETTINGS_FILE_DIR)) fs.mkdirSync(SETTINGS_FILE_DIR, { recursive: true });
          fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(memoryCache, null, 2), "utf-8");
        } catch {
          // Ignore file write error
        }
        return memoryCache;
      }
    }
  } catch {
    // Ignore Supabase connection error / missing table
  }

  // 3. Fallback to default configuration
  memoryCache = { ...DEFAULT_APP_SETTINGS };
  return memoryCache;
}

/**
 * Updates application settings after validation.
 * Persists to file storage and attempts Supabase table sync.
 */
export async function updateAppSettings(
  input: unknown,
  adminEmail: string = "Admin"
): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
  const parseResult = AppSettingsSchema.safeParse(input);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Données de configuration invalides.",
    };
  }

  const newSettings: AppSettings = {
    ...parseResult.data,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  // 1. Update in-memory cache
  memoryCache = newSettings;

  // 2. Persist to file store
  try {
    if (!fs.existsSync(SETTINGS_FILE_DIR)) {
      fs.mkdirSync(SETTINGS_FILE_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), "utf-8");
  } catch (fileErr) {
    console.error("[AppSettings] Failed to write settings file:", fileErr);
  }

  // 3. Attempt Supabase sync (upsert into app_settings)
  try {
    const supabase = createAdminClient();
    await supabase.from("app_settings").upsert(
      {
        id: "current",
        settings_json: newSettings,
        updated_at: newSettings.updatedAt,
        updated_by: adminEmail,
      },
      { onConflict: "id" }
    );
  } catch {
    // Non-fatal if table does not exist
  }

  return {
    success: true,
    settings: newSettings,
  };
}

/**
 * Resets application settings to default constants.
 */
export async function resetAppSettings(
  adminEmail: string = "Admin"
): Promise<{ success: boolean; settings: AppSettings }> {
  const defaultReset: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  memoryCache = defaultReset;

  try {
    if (!fs.existsSync(SETTINGS_FILE_DIR)) {
      fs.mkdirSync(SETTINGS_FILE_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(defaultReset, null, 2), "utf-8");
  } catch {
    // Non-fatal
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("app_settings").upsert(
      {
        id: "current",
        settings_json: defaultReset,
        updated_at: defaultReset.updatedAt,
        updated_by: adminEmail,
      },
      { onConflict: "id" }
    );
  } catch {
    // Non-fatal
  }

  return {
    success: true,
    settings: defaultReset,
  };
}
