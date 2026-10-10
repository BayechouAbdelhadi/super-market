import { describe, it, expect } from 'vitest';
import {
  getAllApps,
  getActiveApps,
  ACCOUNT_APPS,
  CASHIER_APPS,
  ADMIN_APPS,
} from '@/lib/account/apps';

describe('Account Apps Registry', () => {
  describe('Customer Apps', () => {
    it('registers the loyalty app with active status and correct route', () => {
      const loyaltyApp = ACCOUNT_APPS.find((app) => app.id === 'loyalty');
      expect(loyaltyApp).toBeDefined();
      expect(loyaltyApp?.status).toBe('active');
      expect(loyaltyApp?.href).toBe('/account/loyalty');
      expect(loyaltyApp?.category).toBe('loyalty');
    });

    it('includes future apps ready for expansion', () => {
      const promosApp = ACCOUNT_APPS.find((app) => app.id === 'promotions');
      expect(promosApp).toBeDefined();
      expect(promosApp?.status).toBe('coming_soon');
    });

    it('filters active apps correctly', () => {
      const activeApps = getActiveApps('CUSTOMER');
      expect(activeApps.length).toBeGreaterThan(0);
      expect(activeApps.every((a) => a.status === 'active')).toBe(true);
    });

    it('returns all apps sorted by order', () => {
      const allApps = getAllApps('CUSTOMER');
      expect(allApps.length).toBe(ACCOUNT_APPS.length);
      for (let i = 0; i < allApps.length - 1; i++) {
        expect(allApps[i].order).toBeLessThanOrEqual(allApps[i + 1].order);
      }
    });
  });

  describe('Cashier Apps', () => {
    it('registers the POS checkout app and customers directory', () => {
      const posApp = CASHIER_APPS.find((app) => app.id === 'cashier-pos');
      expect(posApp).toBeDefined();
      expect(posApp?.status).toBe('active');
      expect(posApp?.href).toBe('/cashier/pos');

      const custApp = CASHIER_APPS.find((app) => app.id === 'customers-dir');
      expect(custApp).toBeDefined();
      expect(custApp?.status).toBe('active');
      expect(custApp?.href).toBe('/customers');
    });

    it('returns cashier apps sorted by order', () => {
      const allApps = getAllApps('CASHIER');
      expect(allApps.length).toBe(CASHIER_APPS.length);
      for (let i = 0; i < allApps.length - 1; i++) {
        expect(allApps[i].order).toBeLessThanOrEqual(allApps[i + 1].order);
      }
    });
  });

  describe('Admin Apps', () => {
    it('registers core admin apps (POS, Analytics, Customers, Cashiers, Live Feed)', () => {
      const posApp = ADMIN_APPS.find((app) => app.id === 'admin-pos');
      const analyticsApp = ADMIN_APPS.find((app) => app.id === 'admin-analytics');
      const custApp = ADMIN_APPS.find((app) => app.id === 'admin-customers');
      const cashiersApp = ADMIN_APPS.find((app) => app.id === 'admin-cashiers');
      const liveApp = ADMIN_APPS.find((app) => app.id === 'admin-live');

      expect(posApp?.href).toBe('/cashier/pos');
      expect(analyticsApp?.href).toBe('/admin/analytics');
      expect(custApp?.href).toBe('/customers');
      expect(cashiersApp?.href).toBe('/admin/cashiers');
      expect(liveApp?.href).toBe('/admin/live');
    });

    it('returns admin apps sorted by order', () => {
      const allApps = getAllApps('ADMIN');
      expect(allApps.length).toBe(ADMIN_APPS.length);
      for (let i = 0; i < allApps.length - 1; i++) {
        expect(allApps[i].order).toBeLessThanOrEqual(allApps[i + 1].order);
      }
    });
  });
});
