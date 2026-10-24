import { afterEach, describe, expect, it, vi } from 'vitest';
import { isArrivalsAdminEnabled, isArrivalsCustomerEnabled } from '@/lib/arrivals/flags';

describe('arrivals feature flags', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('are off when unset or not exactly "true"', () => {
    vi.stubEnv('ARRIVALS_CUSTOMER_ENABLED', '');
    vi.stubEnv('ARRIVALS_ADMIN_ENABLED', '1');
    expect(isArrivalsCustomerEnabled()).toBe(false);
    expect(isArrivalsAdminEnabled()).toBe(false);
  });

  it('turn on independently', () => {
    vi.stubEnv('ARRIVALS_CUSTOMER_ENABLED', 'true');
    vi.stubEnv('ARRIVALS_ADMIN_ENABLED', 'false');
    expect(isArrivalsCustomerEnabled()).toBe(true);
    expect(isArrivalsAdminEnabled()).toBe(false);
  });
});
