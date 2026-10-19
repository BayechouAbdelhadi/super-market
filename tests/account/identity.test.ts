import { describe, it, expect } from 'vitest';
import { resolveDisplayIdentity } from '@/lib/account/identity';

describe('resolveDisplayIdentity', () => {
  it('prefers the profile row', () => {
    const identity = resolveDisplayIdentity(
      { first_name: 'Ahmed', last_name: 'Bayechou', email: 'a@x.fr', phone_number: '0612345678' },
      { email: 'other@x.fr', user_metadata: { first_name: 'Meta' } }
    );
    expect(identity).toEqual({
      firstName: 'Ahmed',
      lastName: 'Bayechou',
      fullName: 'Ahmed Bayechou',
      email: 'a@x.fr',
      phone: '0612345678',
    });
  });

  it('falls back to the auth account and ignores non-string metadata', () => {
    const identity = resolveDisplayIdentity(null, {
      email: 'meta@x.fr',
      user_metadata: { first_name: 'Sara', last_name: 42 },
    });
    expect(identity.fullName).toBe('Sara');
    expect(identity.email).toBe('meta@x.fr');
    expect(identity.phone).toBe('');
  });
});
