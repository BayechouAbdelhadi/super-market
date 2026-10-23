import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AppSettingsSchema } from '@/lib/settings/validation';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings/types';
import { getAppSettings, updateAppSettings, resetAppSettings } from '@/lib/settings/service';
import type { ISettingsStore, StoredSettings } from '@/lib/settings/ports';
import type { AppSettings } from '@/lib/settings/types';

describe('Application Settings & Configuration', () => {
  const testFilePath = path.join(process.cwd(), 'data', 'test-app-settings.json');

  beforeEach(async () => {
    await resetAppSettings('test-suite');
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath);
      } catch {
        // Ignore cleanup error
      }
    }
  });

  describe('Default Configuration Constants', () => {
    it('initializes with a default point value of 0.05 €', () => {
      expect(DEFAULT_APP_SETTINGS.loyalty.pointValueInEuro).toBe(0.05);
    });

    it('initializes with 1 Euro = 1 Point ratio', () => {
      expect(DEFAULT_APP_SETTINGS.loyalty.euroToPointsRatio).toBe(1);
    });

    it('has logical tier progression (Bronze < Silver < Gold < VIP)', () => {
      const { tierSilverMinPoints, tierGoldMinPoints, tierVipMinPoints } = DEFAULT_APP_SETTINGS.loyalty;
      expect(tierSilverMinPoints).toBeLessThan(tierGoldMinPoints);
      expect(tierGoldMinPoints).toBeLessThan(tierVipMinPoints);
    });

    it('includes default POS presets and store identity', () => {
      expect(DEFAULT_APP_SETTINGS.pos.quickPurchaseAmounts.length).toBeGreaterThan(0);
      expect(DEFAULT_APP_SETTINGS.store.storeName).toBe('Super Market Calais');
      expect(DEFAULT_APP_SETTINGS.notifications.sendWelcomeEmail).toBe(true);
      expect(DEFAULT_APP_SETTINGS.notifications.senderEmail).toContain('@');
      expect(DEFAULT_APP_SETTINGS.notifications.senderName).toBe('Super Market Calais');
    });
  });

  describe('Validation Schema (AppSettingsSchema)', () => {
    it('validates a correct configuration object', () => {
      const parseResult = AppSettingsSchema.safeParse(DEFAULT_APP_SETTINGS);
      expect(parseResult.success).toBe(true);
    });

    it('rejects invalid notification sender email', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        notifications: {
          ...DEFAULT_APP_SETTINGS.notifications,
          senderEmail: 'invalid-email-address',
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('fills default opening hours for settings saved before they existed', () => {
      const legacy = { ...DEFAULT_APP_SETTINGS, hours: undefined };
      const result = AppSettingsSchema.safeParse(legacy);
      expect(result.success).toBe(true);
      expect(result.success && result.data.hours).toEqual(DEFAULT_APP_SETTINGS.hours);
    });

    it('rejects an opening range that closes before it opens', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        hours: { ...DEFAULT_APP_SETTINGS.hours, weekly: { ...DEFAULT_APP_SETTINGS.hours.weekly, 1: [{ open: '19:00', close: '09:00' }] } },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(!result.success && result.error.issues[0].message).toContain('Lundi');
    });

    it('rejects overlapping opening ranges', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        hours: {
          ...DEFAULT_APP_SETTINGS.hours,
          weekly: { ...DEFAULT_APP_SETTINGS.hours.weekly, 2: [{ open: '09:00', close: '13:00' }, { open: '12:00', close: '19:00' }] },
        },
      };
      expect(AppSettingsSchema.safeParse(invalid).success).toBe(false);
    });

    it('accepts a valid exceptional closure and rejects one ending before it starts', () => {
      const withClosure = (startDate: string, endDate: string) => ({
        ...DEFAULT_APP_SETTINGS,
        hours: { ...DEFAULT_APP_SETTINGS.hours, closures: [{ id: 'c1', startDate, endDate, reason: 'Noël' }] },
      });
      expect(AppSettingsSchema.safeParse(withClosure('2026-12-24', '2026-12-26')).success).toBe(true);
      expect(AppSettingsSchema.safeParse(withClosure('2026-12-26', '2026-12-24')).success).toBe(false);
      expect(AppSettingsSchema.safeParse(withClosure('2026-02-30', '2026-02-30')).success).toBe(false);
    });

    it('rejects point value <= 0', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          pointValueInEuro: 0,
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects point value exceeding 1.00 €', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          pointValueInEuro: 1.5,
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects tier thresholds where Gold is not strictly greater than Silver', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          tierSilverMinPoints: 1000,
          tierGoldMinPoints: 500, // Invalid: Gold < Silver
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects tier thresholds where VIP is not strictly greater than Gold', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          tierGoldMinPoints: 2000,
          tierVipMinPoints: 1500, // Invalid: VIP < Gold
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email in store identity', () => {
      const invalid = {
        ...DEFAULT_APP_SETTINGS,
        store: {
          ...DEFAULT_APP_SETTINGS.store,
          email: 'not-an-email',
        },
      };
      const result = AppSettingsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Settings Service (getAppSettings, updateAppSettings, resetAppSettings)', () => {
    it('retrieves settings matching default configuration', async () => {
      const settings = await getAppSettings();
      expect(settings.loyalty.pointValueInEuro).toBe(0.05);
      expect(settings.store.storeName).toBe('Super Market Calais');
    });

    it('updates point value in Euro and other properties', async () => {
      const updated = {
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          pointValueInEuro: 0.08,
        },
        store: {
          ...DEFAULT_APP_SETTINGS.store,
          tagline: 'Le meilleur marché de Calais',
        },
      };

      const result = await updateAppSettings(updated, 'admin@example.com');
      expect(result.success).toBe(true);
      expect(result.settings?.loyalty.pointValueInEuro).toBe(0.08);
      expect(result.settings?.updatedBy).toBe('admin@example.com');

      const current = await getAppSettings();
      expect(current.loyalty.pointValueInEuro).toBe(0.08);
      expect(current.store.tagline).toBe('Le meilleur marché de Calais');
    });

    it('resets settings back to default 0.05 €', async () => {
      await updateAppSettings({
        ...DEFAULT_APP_SETTINGS,
        loyalty: {
          ...DEFAULT_APP_SETTINGS.loyalty,
          pointValueInEuro: 0.12,
        },
      });

      const resetResult = await resetAppSettings('admin@example.com');
      expect(resetResult.success).toBe(true);
      expect(resetResult.settings.loyalty.pointValueInEuro).toBe(0.05);

      const current = await getAppSettings();
      expect(current.loyalty.pointValueInEuro).toBe(0.05);
    });
  });

  describe('Opening hours persistence', () => {
    class MemoryStore implements ISettingsStore {
      stored: StoredSettings | null = null;
      async load() {
        return this.stored;
      }
      async save(settings: AppSettings) {
        // JSON round-trip, as Supabase JSONB and the backup file do (numeric day keys become strings)
        this.stored = { settings: JSON.parse(JSON.stringify(settings)), updatedAt: settings.updatedAt };
      }
    }

    it('saves exceptional closures and reads them back', async () => {
      const stores = { primary: new MemoryStore(), backup: new MemoryStore() };
      const closure = { id: 'a1b2', startDate: '2026-12-24', endDate: '2026-12-26', reason: 'Noël' };
      const result = await updateAppSettings(
        { ...DEFAULT_APP_SETTINGS, hours: { ...DEFAULT_APP_SETTINGS.hours, closures: [closure] } },
        'test',
        stores
      );
      expect(result.success).toBe(true);

      const reloaded = await getAppSettings(stores);
      expect(reloaded.hours.closures).toEqual([closure]);
      expect(reloaded.hours.weekly[1]).toEqual(DEFAULT_APP_SETTINGS.hours.weekly[1]);
    });
  });
});
