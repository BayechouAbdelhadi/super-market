import fs from "fs";
import path from "path";
import { ISettingsStore, StoredSettings } from "../ports";
import { AppSettings } from "../types";

const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const SETTINGS_FILE_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE_PATH = isTestEnv
  ? path.join(SETTINGS_FILE_DIR, "test-app-settings.json")
  : path.join(SETTINGS_FILE_DIR, "app-settings.json");

/**
 * Infrastructure Adapter: local JSON file kept as an offline backup of the settings.
 */
export class FileSettingsStore implements ISettingsStore {
  async load(): Promise<StoredSettings | null> {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      return null;
    }
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, "utf-8"));
    return { settings: parsed, updatedAt: parsed.updatedAt, updatedBy: parsed.updatedBy };
  }

  async save(settings: AppSettings): Promise<void> {
    if (!fs.existsSync(SETTINGS_FILE_DIR)) {
      fs.mkdirSync(SETTINGS_FILE_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
  }
}
