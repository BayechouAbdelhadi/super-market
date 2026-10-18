import { AppSettings } from "./types";

/** Raw settings as persisted (validated by the service before use). */
export interface StoredSettings {
  settings: unknown;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Domain Port: persistence of the application settings document.
 * `load` returns null when nothing is stored; both methods may throw when the store is unreachable.
 */
export interface ISettingsStore {
  load(): Promise<StoredSettings | null>;
  save(settings: AppSettings): Promise<void>;
}
