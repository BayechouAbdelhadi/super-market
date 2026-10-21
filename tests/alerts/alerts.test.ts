import { describe, it, expect, vi } from 'vitest';
import { ALERTS_CONFIG } from '@/lib/alerts/config';
import { createAlert, getBannerAlerts, sortAlertsForBanner } from '@/lib/alerts/service';
import { CreateAlertSchema, UpdateAlertSchema, AlertIdSchema } from '@/lib/alerts/validation';
import type { ISiteAlertRepository } from '@/lib/alerts/ports';
import type { AlertLevel, NewSiteAlert, SiteAlert, SiteAlertPage } from '@/lib/alerts/types';

class MemoryAlertRepository implements ISiteAlertRepository {
  constructor(public alerts: SiteAlert[] = []) {}

  async list(offset: number, limit: number): Promise<SiteAlertPage> {
    const sorted = [...this.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  }

  async listActive(limit: number): Promise<SiteAlert[]> {
    return (await this.list(0, this.alerts.length)).items.filter((a) => a.isActive).slice(0, limit);
  }

  async create(alert: NewSiteAlert): Promise<SiteAlert> {
    const created: SiteAlert = {
      id: `id-${this.alerts.length + 1}`,
      ...alert,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.alerts.push(created);
    return created;
  }

  async setActive(id: string, isActive: boolean): Promise<SiteAlert | null> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.isActive = isActive;
    return alert;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.alerts.length;
    this.alerts = this.alerts.filter((a) => a.id !== id);
    return this.alerts.length < before;
  }
}

function alert(id: string, level: AlertLevel, createdAt: string, isActive = true): SiteAlert {
  return { id, message: `Message ${id}`, level, isActive, createdAt, createdBy: null };
}

describe('Site alerts', () => {
  describe('validation', () => {
    it('trims the message and accepts the three levels', () => {
      for (const level of ['INFO', 'WARNING', 'CRITICAL']) {
        const parsed = CreateAlertSchema.safeParse({ message: '  Fermeture à 17h  ', level });
        expect(parsed.success).toBe(true);
        expect(parsed.data?.message).toBe('Fermeture à 17h');
      }
    });

    it('rejects an empty, blank or too long message', () => {
      expect(CreateAlertSchema.safeParse({ message: '', level: 'INFO' }).success).toBe(false);
      expect(CreateAlertSchema.safeParse({ message: '   ', level: 'INFO' }).success).toBe(false);
      const tooLong = 'a'.repeat(ALERTS_CONFIG.messageMaxLength + 1);
      expect(CreateAlertSchema.safeParse({ message: tooLong, level: 'INFO' }).success).toBe(false);
    });

    it('rejects an unknown level', () => {
      expect(CreateAlertSchema.safeParse({ message: 'Hello', level: 'URGENT' }).success).toBe(false);
    });

    it('requires a boolean visibility and a uuid id', () => {
      expect(UpdateAlertSchema.safeParse({ isActive: 'yes' }).success).toBe(false);
      expect(UpdateAlertSchema.safeParse({ isActive: false }).success).toBe(true);
      expect(AlertIdSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(AlertIdSchema.safeParse('3f1c2b9e-8a7d-4c6b-9e5f-1a2b3c4d5e6f').success).toBe(true);
    });
  });

  describe('createAlert', () => {
    it('stores the message, level and author, active by default', async () => {
      const repo = new MemoryAlertRepository();
      const created = await createAlert({ message: 'Arrivage', level: 'INFO' }, 'admin@test.fr', repo);
      expect(created).toMatchObject({ message: 'Arrivage', level: 'INFO', createdBy: 'admin@test.fr', isActive: true });
    });
  });

  describe('banner selection', () => {
    it('shows the most severe first, then the newest', () => {
      const sorted = sortAlertsForBanner([
        alert('old-info', 'INFO', '2026-10-01T10:00:00Z'),
        alert('critical', 'CRITICAL', '2026-09-01T10:00:00Z'),
        alert('new-info', 'INFO', '2026-10-20T10:00:00Z'),
        alert('warning', 'WARNING', '2026-10-05T10:00:00Z'),
      ]);
      expect(sorted.map((a) => a.id)).toEqual(['critical', 'warning', 'new-info', 'old-info']);
    });

    it('skips hidden alerts and caps the number of banners', async () => {
      const repo = new MemoryAlertRepository([
        alert('hidden', 'CRITICAL', '2026-10-20T10:00:00Z', false),
        ...Array.from({ length: ALERTS_CONFIG.bannerMaxCount + 2 }, (_, i) =>
          alert(`a${i}`, 'INFO', `2026-10-0${i + 1}T10:00:00Z`)
        ),
      ]);
      const banners = await getBannerAlerts(repo);
      expect(banners).toHaveLength(ALERTS_CONFIG.bannerMaxCount);
      expect(banners.some((a) => a.id === 'hidden')).toBe(false);
    });

    it('returns no banner instead of throwing when storage fails', async () => {
      const repo = new MemoryAlertRepository();
      repo.listActive = vi.fn().mockRejectedValue(new Error('db down'));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(getBannerAlerts(repo)).resolves.toEqual([]);
      spy.mockRestore();
    });
  });
});
