import { describe, it, expect } from 'vitest';
import { authFailureMessage } from '@/lib/auth/auth-errors';
import { activationSender, shouldSendActivationEmail } from '@/lib/email/activation';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/lib/settings/types';

function withNotifications(notifications: Partial<AppSettings['notifications']>): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...notifications } };
}

describe('authFailureMessage', () => {
  it('returns French messages, never raw auth-server text', () => {
    expect(authFailureMessage('EMAIL_TAKEN')).toBe('Un compte existe déjà avec cette adresse email.');
    expect(authFailureMessage('UNKNOWN')).toBe('Erreur lors de la création du compte.');
  });
});

describe('activation email settings', () => {
  it('uses the cashier toggle for cashiers and the welcome toggle otherwise', () => {
    const settings = withNotifications({ sendCashierInviteEmail: false, sendWelcomeEmail: true });
    expect(shouldSendActivationEmail('CASHIER', settings)).toBe(false);
    expect(shouldSendActivationEmail('CUSTOMER', settings)).toBe(true);
  });

  it('builds the sender from settings, falling back to the store name', () => {
    expect(activationSender(withNotifications({ senderEmail: '' }))).toBeUndefined();
    const settings = withNotifications({ senderEmail: 'noreply@x.fr', senderName: '' });
    expect(activationSender(settings)).toEqual({ email: 'noreply@x.fr', name: settings.store.storeName });
  });
});
