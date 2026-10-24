import { describe, it, expect } from 'vitest';
import { safeNextPath, withNextParam } from '@/lib/auth/redirect';

describe('Redirect after login', () => {
  it('keeps same-origin paths', () => {
    expect(safeNextPath('/arrivages/abc')).toBe('/arrivages/abc');
    expect(safeNextPath('/account/reservations?x=1')).toBe('/account/reservations?x=1');
  });

  it('rejects anything that could leave the site', () => {
    for (const value of ['//evil.tld', '/\\evil.tld', 'https://evil.tld', 'evil', '', null, undefined, 42]) {
      expect(safeNextPath(value)).toBeNull();
    }
  });

  it('adds the parameter only when it is safe', () => {
    expect(withNextParam('/login', '/arrivages/abc')).toBe('/login?next=%2Farrivages%2Fabc');
    expect(withNextParam('/login', '//evil.tld')).toBe('/login');
    expect(withNextParam('/login', undefined)).toBe('/login');
  });
});
