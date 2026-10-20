import { AppSettings, DEFAULT_APP_SETTINGS } from "./types";
import { AppSettingsSchema } from "./validation";
import { ISettingsStore, StoredSettings } from "./ports";
import { SupabaseSettingsStore } from "./adapters/supabase-settings-store";
import { FileSettingsStore } from "./adapters/file-settings-store";

export interface SettingsStores {
  /** Primary cloud store */
  primary: ISettingsStore;
  /** Local offline backup */
  backup: ISettingsStore;
}

const defaultStores: SettingsStores = {
  primary: new SupabaseSettingsStore(),
  backup: new FileSettingsStore(),
};

let memoryCache: AppSettings | null = null;

/**
 * Validates stored settings and fills any missing section with defaults.
 */
function toAppSettings(stored: StoredSettings | null): AppSettings | null {
  if (!stored) {
    return null;
  }
  const validated = AppSettingsSchema.safeParse(stored.settings);
  if (!validated.success) {
    return null;
  }
  return {
    ...DEFAULT_APP_SETTINGS,
    ...validated.data,
    loyalty: { ...DEFAULT_APP_SETTINGS.loyalty, ...validated.data.loyalty },
    pos: { ...DEFAULT_APP_SETTINGS.pos, ...validated.data.pos },
    store: { ...DEFAULT_APP_SETTINGS.store, ...validated.data.store },
    notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...validated.data.notifications },
    hours: validated.data.hours,
    updatedAt: stored.updatedAt,
    updatedBy: stored.updatedBy,
  };
}

/**
 * Persists settings to both stores. Store failures are logged, never fatal.
 */
async function persist(settings: AppSettings, stores: SettingsStores) {
  try {
    await stores.backup.save(settings);
  } catch (fileErr) {
    console.error("[AppSettings] Failed to write settings file:", fileErr);
  }

  try {
    await stores.primary.save(settings);
  } catch (err) {
    console.warn("[AppSettings] Supabase connection failed:", err);
  }
}

/**
 * Loads current application settings.
 * Priority: Supabase Table (Primary Cloud Store) -> Local File System Store -> In-Memory Cache -> Defaults
 */
export async function getAppSettings(stores: SettingsStores = defaultStores): Promise<AppSettings> {
  // 1. Primary: Try Supabase app_settings table first if configured
  try {
    const remote = toAppSettings(await stores.primary.load());
    if (remote) {
      memoryCache = remote;

      // Keep local file storage in sync as an offline backup
      try {
        await stores.backup.save(remote);
      } catch {
        // Ignore file write error in restricted runtime
      }

      return memoryCache;
    }
  } catch {
    // Supabase unavailable or running in offline/isolated environment -> fall through
  }

  // 2. Secondary: Try local file system storage
  try {
    const local = toAppSettings(await stores.backup.load());
    if (local) {
      memoryCache = local;
      return memoryCache;
    }
  } catch (err) {
    console.warn("[AppSettings] Failed to read from file storage, falling back:", err);
  }

  if (memoryCache) {
    return memoryCache;
  }

  // 3. Fallback to default constants
  memoryCache = { ...DEFAULT_APP_SETTINGS };
  return memoryCache;
}

/**
 * Updates application settings after validation.
 * Persists to Supabase table and local file storage.
 */
export async function updateAppSettings(
  input: unknown,
  adminEmail: string = "Admin",
  stores: SettingsStores = defaultStores
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

  memoryCache = newSettings;
  await persist(newSettings, stores);

  return {
    success: true,
    settings: newSettings,
  };
}

/**
 * Resets application settings to default constants.
 */
export async function resetAppSettings(
  adminEmail: string = "Admin",
  stores: SettingsStores = defaultStores
): Promise<{ success: boolean; settings: AppSettings }> {
  const defaultReset: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  memoryCache = defaultReset;
  await persist(defaultReset, stores);

  return {
    success: true,
    settings: defaultReset,
  };
}
