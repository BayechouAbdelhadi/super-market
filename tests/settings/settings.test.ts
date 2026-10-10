import { describe, it, expect, beforeEach } from 'vitest';
import { AppSettingsSchema } from '@/lib/settings/validation';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings/types';
import { getAppSettings, updateAppSettings, resetAppSettings } from '@/lib/settings/service';

describe('Application Settings & Configuration', () => {
  beforeEach(async () => {
    await resetAppSettings('test-suite');
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
      expect(DEFAULT_APP_SETTINGS.pos.quickRedeemPoints.length).toBeGreaterThan(0);
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
});
