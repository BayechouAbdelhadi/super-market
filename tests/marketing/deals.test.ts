import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateCampaignSchema } from '@/lib/marketing/validation';
import { renderDealEmailHtml } from '@/lib/marketing/templates/deal-email';
import {
  processCampaignBatch,
  triggerDueCampaigns,
  CampaignBusyError,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
  deduplicateRecipients,
  unsubscribeCustomerEmail,
  resubscribeCustomerEmail,
  isCustomerEmailUnsubscribed,
  countAudienceByTier,
} from '@/lib/marketing/service';
import { IMarketingCampaignRepository, ICampaignAudienceRepository } from '@/lib/marketing/ports';
import { LOYALTY_CONFIG } from '@/lib/loyalty/config';
import { MarketingCampaign, CampaignRecipient } from '@/lib/marketing/types';
import { emailService } from '@/lib/email';

// In-memory mock repository for tests
class MockMarketingRepository implements IMarketingCampaignRepository {
  private campaigns: Map<string, MarketingCampaign> = new Map();

  async getAll(): Promise<MarketingCampaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    return this.campaigns.get(id) || null;
  }

  async save(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    this.campaigns.set(campaign.id, JSON.parse(JSON.stringify(campaign)));
    return campaign;
  }

  async delete(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.recipients || [];
  }

  async saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.recipients = recipients;
    }
  }

  readonly locks: Set<string> = new Set();

  async tryLock(campaignId: string): Promise<boolean> {
    if (!this.campaigns.has(campaignId) || this.locks.has(campaignId)) return false;
    this.locks.add(campaignId);
    return true;
  }

  async unlock(campaignId: string): Promise<void> {
    this.locks.delete(campaignId);
  }

  private unsubscribes: Set<string> = new Set();

  async getUnsubscribedEmails(): Promise<string[]> {
    return Array.from(this.unsubscribes);
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    return this.unsubscribes.has(email.toLowerCase().trim());
  }

  async unsubscribe(email: string): Promise<boolean> {
    this.unsubscribes.add(email.toLowerCase().trim());
    return true;
  }

  async resubscribe(email: string): Promise<boolean> {
    this.unsubscribes.delete(email.toLowerCase().trim());
    return true;
  }
}

describe('Marketing Deals & Email Campaigns', () => {
  let mockRepo: MockMarketingRepository;

  beforeEach(() => {
    mockRepo = new MockMarketingRepository();
    vi.clearAllMocks();
    // Unsubscribe links are HMAC-signed: provide a signing secret
    vi.stubEnv('AUTH_TOKEN_SECRET', 'test-auth-token-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Validation Schema (CreateCampaignSchema)', () => {
    it('validates a valid one-shot campaign', () => {
      const valid = {
        title: 'Promotion Week-end Fraîcheur',
        targetTiers: ['BRONZE', 'SILVER', 'GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-15',
        endDate: '2026-10-16',
        subject: '15% de réduction ce samedi !',
        content: 'Venez profiter de nos promotions exceptionnelles au rayon boucherie.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
        ctaText: 'Voir les promos',
        ctaUrl: 'https://supermarketcalais.com/promos',
      };

      const result = CreateCampaignSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates a valid daily limit campaign', () => {
      const valid = {
        title: 'Campagne VIP progressive',
        targetTiers: ['VIP'],
        dispatchMode: 'DAILY_LIMIT',
        dailyLimit: 50,
        startDate: '2026-10-15',
        endDate: '2026-10-25',
        subject: 'Offre exclusive pour nos membres VIP',
        content: 'Profitez de 2x plus de points fidélité toute la semaine.',
      };

      const result = CreateCampaignSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects campaign with no target tiers selected (Step 1)', () => {
      const invalid = {
        title: 'Campagne sans cible',
        targetTiers: [],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        subject: 'Sujet test',
        content: 'Contenu test',
      };

      const result = CreateCampaignSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('au moins une catégorie');
      }
    });

    it('rejects daily limit mode if limit is missing or <= 0 (Step 2)', () => {
      const invalid = {
        title: 'Campagne limite invalide',
        targetTiers: ['GOLD'],
        dispatchMode: 'DAILY_LIMIT',
        dailyLimit: 0,
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        subject: 'Sujet',
        content: 'Contenu',
      };

      const result = CreateCampaignSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects date range where start date > end date (Step 3)', () => {
      const invalid = {
        title: 'Dates inversées',
        targetTiers: ['SILVER'],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-25',
        endDate: '2026-10-15',
        subject: 'Offre spéciale valide',
        content: 'Contenu promotionnel valide avec plus de 10 caractères.',
      };

      const result = CreateCampaignSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('postérieure'))).toBe(true);
      }
    });

    it('rejects content with empty subject or text (Step 4)', () => {
      const invalid = {
        title: 'Titre',
        targetTiers: ['BRONZE'],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        subject: '',
        content: '',
      };

      const result = CreateCampaignSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts partial content when status is DRAFT', () => {
      const draft = {
        title: 'Brouillon en cours',
        status: 'DRAFT' as const,
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE' as const,
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        subject: '',
        content: '',
      };

      const result = CreateCampaignSchema.safeParse(draft);
      expect(result.success).toBe(true);
    });
  });

  describe('HTML Email Template (renderDealEmailHtml)', () => {
    it('renders customer name, tier badge, store address and phone', () => {
      const html = renderDealEmailHtml({
        customerName: 'Samira Haddad',
        tier: 'GOLD',
        subject: 'Offre exclusive du week-end',
        content: 'Bénéficiez de 10€ offerts dès 50€ d’achat.',
        imageUrl: 'https://example.com/promo.jpg',
        ctaText: 'En profiter en magasin',
        ctaUrl: 'https://supermarketcalais.com',
        storeName: 'Super Market Calais',
        storeAddress: '205 Avenue Antoine de Saint-Exupéry, 62100 Calais',
        storePhone: '06 71 54 05 28',
      });

      expect(html).toContain('Samira Haddad');
      expect(html).toContain('Palier GOLD');
      expect(html).toContain('Bénéficiez de 10€ offerts dès 50€ d’achat.');
      expect(html).toContain('https://example.com/promo.jpg');
      expect(html).toContain('En profiter en magasin');
      expect(html).toContain('Super Market Calais');
      expect(html).toContain('205 Avenue Antoine de Saint-Exupéry, 62100 Calais');
      expect(html).toContain('06 71 54 05 28');
      expect(html).toContain('Se désinscrire');
      expect(html).toContain('Vous ne souhaitez plus recevoir ces e-mails ?');
    });
  });

  describe('Execution Engine & Resilience (Never Fail on Recipient Error)', () => {
    it('never fails a job when an email fails; logs stats and continues processing', async () => {
      const campaign: MarketingCampaign = {
        id: 'job-resilience-1',
        title: 'Test Résilience',
        status: 'RUNNING',
        targetTiers: ['BRONZE', 'SILVER'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Bon Plan Test',
        content: 'Contenu test',
        imageUrl: null,
        ctaText: 'Voir',
        ctaUrl: 'https://example.com',
        stats: {
          totalTargets: 3,
          sentCount: 0,
          failedCount: 0,
          remainingCount: 3,
          progressPercentage: 0,
        },
        recipients: [
          {
            customerId: 'cust-1',
            email: 'good@example.com',
            fullName: 'Client Valide',
            tier: 'BRONZE',
            status: 'PENDING',
          },
          {
            customerId: 'cust-2',
            email: 'bounced@example.com',
            fullName: 'Client Bounced',
            tier: 'SILVER',
            status: 'PENDING',
          },
          {
            customerId: 'cust-3',
            email: 'throw@example.com',
            fullName: 'Client Exception',
            tier: 'BRONZE',
            status: 'PENDING',
          },
        ],
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
        completedAt: null,
        createdBy: 'admin@supermarket.fr',
      };

      await mockRepo.save(campaign);

      // Mock emailService: 1st succeeds, 2nd returns failure, 3rd throws network error
      vi.spyOn(emailService, 'sendEmail').mockImplementation(async ({ to }) => {
        const recipientEmail = to[0].email;
        if (recipientEmail === 'good@example.com') {
          return { success: true };
        }
        if (recipientEmail === 'bounced@example.com') {
          return { success: false, error: 'Boîte de messagerie saturée' };
        }
        throw new Error('Connexion réseau interrompue');
      });

      // Execute batch
      const result = await processCampaignBatch('job-resilience-1', mockRepo);

      expect(result).not.toBeNull();
      expect(result?.processedCount).toBe(3);
      expect(result?.sentInBatch).toBe(1);
      expect(result?.failedInBatch).toBe(2);
      expect(result?.newStatus).toBe('COMPLETED');

      // Verify the campaign stored in repository
      const updated = await mockRepo.getById('job-resilience-1');
      expect(updated).not.toBeNull();
      expect(updated?.stats.sentCount).toBe(1);
      expect(updated?.stats.failedCount).toBe(2);
      expect(updated?.stats.remainingCount).toBe(0);
      expect(updated?.stats.progressPercentage).toBe(100);

      // Check recipient statuses
      const r1 = updated?.recipients.find((r) => r.customerId === 'cust-1');
      const r2 = updated?.recipients.find((r) => r.customerId === 'cust-2');
      const r3 = updated?.recipients.find((r) => r.customerId === 'cust-3');

      expect(r1?.status).toBe('SENT');
      expect(r1?.sentAt).toBeDefined();

      expect(r2?.status).toBe('FAILED');
      expect(r2?.error).toBe('Boîte de messagerie saturée');

      expect(r3?.status).toBe('FAILED');
      expect(r3?.error).toBe('Connexion réseau interrompue');
    });

    it('respects daily limit and processes only the configured chunk per day', async () => {
      const campaign: MarketingCampaign = {
        id: 'job-daily-limit',
        title: 'Campagne par lot de 2',
        status: 'RUNNING',
        targetTiers: ['GOLD'],
        dispatchMode: 'DAILY_LIMIT',
        dailyLimit: 2,
        startDate: '2026-10-15',
        endDate: '2026-10-25',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Lot 1',
        content: 'Lot 1 content',
        imageUrl: null,
        ctaText: 'Voir',
        ctaUrl: 'https://example.com',
        stats: {
          totalTargets: 5,
          sentCount: 0,
          failedCount: 0,
          remainingCount: 5,
          progressPercentage: 0,
        },
        recipients: Array.from({ length: 5 }, (_, i) => ({
          customerId: `cust-${i + 1}`,
          email: `client${i + 1}@example.com`,
          fullName: `Client ${i + 1}`,
          tier: 'GOLD' as const,
          status: 'PENDING' as const,
        })),
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
        completedAt: null,
        createdBy: 'admin@supermarket.fr',
      };

      await mockRepo.save(campaign);

      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

      // Run 1st batch: should process only 2
      const firstRun = await processCampaignBatch('job-daily-limit', mockRepo);
      expect(firstRun?.processedCount).toBe(2);
      expect(firstRun?.sentInBatch).toBe(2);
      expect(firstRun?.newStatus).toBe('RUNNING');
      expect(firstRun?.stats.remainingCount).toBe(3);
      expect(firstRun?.stats.progressPercentage).toBe(40);

      // Run 2nd batch: should process next 2
      const secondRun = await processCampaignBatch('job-daily-limit', mockRepo);
      expect(secondRun?.processedCount).toBe(2);
      expect(secondRun?.sentInBatch).toBe(2);
      expect(secondRun?.newStatus).toBe('RUNNING');
      expect(secondRun?.stats.remainingCount).toBe(1);
      expect(secondRun?.stats.progressPercentage).toBe(80);

      // Run 3rd batch: should process the final 1 and mark COMPLETED
      const thirdRun = await processCampaignBatch('job-daily-limit', mockRepo);
      expect(thirdRun?.processedCount).toBe(1);
      expect(thirdRun?.newStatus).toBe('COMPLETED');
      expect(thirdRun?.stats.remainingCount).toBe(0);
      expect(thirdRun?.stats.progressPercentage).toBe(100);
    });

    it('allows pausing, resuming, and prevents execution while paused', async () => {
      const campaign: MarketingCampaign = {
        id: 'job-pause-test',
        title: 'Campagne Pausable',
        status: 'RUNNING',
        targetTiers: ['VIP'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Sujet',
        content: 'Texte',
        imageUrl: null,
        ctaText: 'Bouton',
        ctaUrl: 'https://example.com',
        stats: {
          totalTargets: 2,
          sentCount: 0,
          failedCount: 0,
          remainingCount: 2,
          progressPercentage: 0,
        },
        recipients: [
          {
            customerId: 'c1',
            email: 'vip1@example.com',
            fullName: 'VIP 1',
            tier: 'VIP',
            status: 'PENDING',
          },
          {
            customerId: 'c2',
            email: 'vip2@example.com',
            fullName: 'VIP 2',
            tier: 'VIP',
            status: 'PENDING',
          },
        ],
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
        completedAt: null,
        createdBy: 'admin@supermarket.fr',
      };

      await mockRepo.save(campaign);

      // Pause job
      const paused = await pauseCampaign('job-pause-test', mockRepo);
      expect(paused?.status).toBe('PAUSED');

      // Attempt to run while paused: must NOT process any emails
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail');
      const batchResult = await processCampaignBatch('job-pause-test', mockRepo);
      expect(batchResult?.processedCount).toBe(0);
      expect(batchResult?.newStatus).toBe('PAUSED');
      expect(sendEmailSpy).not.toHaveBeenCalled();

      // Resume job
      const resumed = await resumeCampaign('job-pause-test', mockRepo);
      expect(resumed?.status).toBe('RUNNING');

      // Now run batch: emails should be sent
      sendEmailSpy.mockResolvedValue({ success: true });
      const runAfterResume = await processCampaignBatch('job-pause-test', mockRepo);
      expect(runAfterResume?.processedCount).toBe(2);
      expect(runAfterResume?.newStatus).toBe('COMPLETED');
    });

    it('allows deleting a campaign', async () => {
      const campaign: MarketingCampaign = {
        id: 'job-to-delete',
        title: 'Campagne à supprimer',
        status: 'DRAFT',
        targetTiers: ['BRONZE'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Test',
        content: 'Test',
        imageUrl: null,
        ctaText: 'Test',
        ctaUrl: 'https://example.com',
        stats: {
          totalTargets: 0,
          sentCount: 0,
          failedCount: 0,
          remainingCount: 0,
          progressPercentage: 0,
        },
        recipients: [],
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
        completedAt: null,
        createdBy: 'admin@supermarket.fr',
      };

      await mockRepo.save(campaign);
      expect(await mockRepo.getById('job-to-delete')).not.toBeNull();

      const deleted = await deleteCampaign('job-to-delete', mockRepo);
      expect(deleted).toBe(true);
      expect(await mockRepo.getById('job-to-delete')).toBeNull();
    });
  });

  describe('Supabase Marketing Adapter (SupabaseMarketingRepository)', () => {
    it('is registered as the default repository implementing IMarketingCampaignRepository', async () => {
      const { SupabaseMarketingRepository, defaultMarketingRepo } = await import(
        '@/lib/marketing/adapters/supabase-marketing-repository'
      );
      const repo = new SupabaseMarketingRepository();
      expect(repo).toBeDefined();
      expect(typeof repo.getAll).toBe('function');
      expect(typeof repo.getById).toBe('function');
      expect(typeof repo.save).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.getRecipients).toBe('function');
      expect(typeof repo.saveRecipients).toBe('function');
      expect(defaultMarketingRepo).toBeInstanceOf(SupabaseMarketingRepository);
    });
  });

  describe('Midnight Schedule Execution (00:00)', () => {
    it('defaults scheduledTime to 00:00 (Midnight) in schema', () => {
      const parsed = CreateCampaignSchema.parse({
        title: 'Campagne de Minuit',
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        subject: 'Offre nocturne',
        content: 'Profitez de nos offres exclusives dès ce soir minuit.',
      });

      expect(parsed.scheduledTime).toBe('00:00');
    });

    it('rejects invalid scheduledTime format', () => {
      const result = CreateCampaignSchema.safeParse({
        title: 'Campagne Format Invalide',
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        scheduledTime: '25:99',
        subject: 'Offre test',
        content: 'Contenu avec plus de dix caractères requis.',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Europe/Paris Timezone Enforcement', () => {
    it('always resolves date in Europe/Paris across UTC midnight boundary', async () => {
      const { getParisDateString, TIMEZONE_PARIS } = await import('@/lib/utils/timezone');
      expect(TIMEZONE_PARIS).toBe('Europe/Paris');

      // 2026-10-14 23:30:00 UTC corresponds to 2026-10-15 01:30:00 CEST in Paris
      const lateUtc = new Date('2026-10-14T23:30:00.000Z');
      expect(lateUtc.toISOString().slice(0, 10)).toBe('2026-10-14');
      expect(getParisDateString(lateUtc)).toBe('2026-10-15');
    });
  });

  describe('Due Campaign Detection and Triggering (isCampaignDueNow & triggerDueCampaigns)', () => {
    it('detects a campaign whose scheduled time has arrived/passed today', async () => {
      const { isCampaignDueNow } = await import('@/lib/marketing/service');
      // 2026-10-15 14:00 UTC = 16:00 in Paris
      const refDate = new Date('2026-10-15T14:00:00.000Z');

      const dueCampaign: MarketingCampaign = {
        id: 'c1',
        title: 'Campagne de l’aube',
        status: 'RUNNING',
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-15',
        endDate: '2026-10-22',
        scheduledTime: '04:42',
        lastRunDate: null,
        subject: 'Offre',
        content: 'Contenu',
        imageUrl: null,
        stats: { totalTargets: 5, sentCount: 0, failedCount: 0, remainingCount: 5, progressPercentage: 0 },
        recipients: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      expect(isCampaignDueNow(dueCampaign, refDate)).toBe(true);

      // Future time today: scheduled at 18:00, refDate is 16:00 -> NOT due yet
      const futureTodayCampaign: MarketingCampaign = {
        ...dueCampaign,
        scheduledTime: '18:00',
      };
      expect(isCampaignDueNow(futureTodayCampaign, refDate)).toBe(false);

      // Completed, paused, or draft -> NOT due
      expect(isCampaignDueNow({ ...dueCampaign, status: 'COMPLETED' }, refDate)).toBe(false);
      expect(isCampaignDueNow({ ...dueCampaign, status: 'PAUSED' }, refDate)).toBe(false);
      expect(isCampaignDueNow({ ...dueCampaign, status: 'DRAFT' }, refDate)).toBe(false);

      // DAILY_LIMIT already run today -> NOT due
      expect(
        isCampaignDueNow(
          { ...dueCampaign, dispatchMode: 'DAILY_LIMIT', lastRunDate: '2026-10-15' },
          refDate
        )
      ).toBe(false);
    });

    it('triggers due campaigns via triggerDueCampaigns', async () => {
      const { triggerDueCampaigns } = await import('@/lib/marketing/service');
      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true, messageId: 'm-1' });

      const campaign: MarketingCampaign = {
        id: 'due-1',
        title: 'Campagne Due',
        status: 'RUNNING',
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        scheduledTime: '00:01',
        lastRunDate: null,
        subject: 'Sujet test',
        content: 'Contenu test',
        imageUrl: null,
        stats: { totalTargets: 1, sentCount: 0, failedCount: 0, remainingCount: 1, progressPercentage: 0 },
        recipients: [
          { customerId: 'c1', email: 'c1@test.com', fullName: 'Client 1', tier: 'GOLD', status: 'PENDING' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      await mockRepo.save(campaign);

      const results = await triggerDueCampaigns(mockRepo);
      expect(results.length).toBe(1);
      expect(results[0].newStatus).toBe('COMPLETED');
      expect(results[0].sentInBatch).toBe(1);

      const updated = await mockRepo.getById('due-1');
      expect(updated?.status).toBe('COMPLETED');
    });
  });

  describe('Recipient Deduplication & Multi-Edit Draft Safety', () => {
    it('strictly deduplicates recipients with duplicate customerIds or duplicate emails', () => {
      const rawRecipients: CampaignRecipient[] = [
        { customerId: 'cust-1', email: 'test@example.com', fullName: 'User 1', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'cust-1', email: 'test@example.com', fullName: 'User 1 Duplicate', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'cust-2', email: 'TEST@EXAMPLE.COM', fullName: 'User 2 (same email capitalized)', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'cust-3', email: 'unique@example.com', fullName: 'User 3', tier: 'GOLD', status: 'PENDING' },
      ];

      const deduplicated = deduplicateRecipients(rawRecipients);
      expect(deduplicated.length).toBe(2);
      expect(deduplicated[0].customerId).toBe('cust-1');
      expect(deduplicated[1].customerId).toBe('cust-3');
    });

    it('prioritizes already SENT status over PENDING when deduplicating', () => {
      const rawRecipients: CampaignRecipient[] = [
        { customerId: 'cust-1', email: 'client@example.com', fullName: 'Client 1', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'cust-1', email: 'client@example.com', fullName: 'Client 1', tier: 'SILVER', status: 'SENT', sentAt: '2026-10-16T12:00:00Z' },
      ];

      const deduplicated = deduplicateRecipients(rawRecipients);
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].status).toBe('SENT');
      expect(deduplicated[0].sentAt).toBe('2026-10-16T12:00:00Z');
    });

    it('editing draft 5 times and running batch sends exactly ONE email per customer', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'mock-msg-id',
      });

      // Customer recipients for the draft
      const baseRecipients: CampaignRecipient[] = [
        { customerId: 'c1', email: 'user1@example.com', fullName: 'User One', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'c2', email: 'user2@example.com', fullName: 'User Two', tier: 'SILVER', status: 'PENDING' },
        { customerId: 'c3', email: 'user3@example.com', fullName: 'User Three', tier: 'SILVER', status: 'PENDING' },
      ];

      const campaign: MarketingCampaign = {
        id: 'draft-test-123',
        title: 'Brouillon Offres Fraîches',
        status: 'DRAFT',
        targetTiers: ['SILVER'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-16',
        endDate: '2026-10-23',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Bons plans du moment',
        content: 'Contenu halal frais',
        imageUrl: null,
        stats: { totalTargets: 3, sentCount: 0, failedCount: 0, remainingCount: 3, progressPercentage: 0 },
        recipients: [...baseRecipients],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      // Simulate user editing and saving draft 5 times in a row!
      for (let i = 1; i <= 5; i++) {
        campaign.title = `Brouillon Offres Fraîches (Edit ${i})`;
        // Simulate potential appending or re-saving recipients
        campaign.recipients = deduplicateRecipients([...campaign.recipients, ...baseRecipients]);
        await mockRepo.save(campaign);
        await mockRepo.saveRecipients(campaign.id, campaign.recipients);
      }

      // Verify repository only has 3 unique recipients
      const savedCampaign = await mockRepo.getById('draft-test-123');
      expect(savedCampaign).not.toBeNull();
      const uniqueRecipients = deduplicateRecipients(savedCampaign!.recipients);
      expect(uniqueRecipients.length).toBe(3);

      // Now change status to RUNNING and process the batch
      savedCampaign!.status = 'RUNNING';
      await mockRepo.save(savedCampaign!);

      const result = await processCampaignBatch('draft-test-123', mockRepo);
      expect(result).not.toBeNull();
      expect(result!.sentInBatch).toBe(3);
      expect(result!.newStatus).toBe('COMPLETED');
      // Exactly 3 emails sent in total (1 per user), NEVER 3 * 5 = 15!
      expect(sendEmailSpy).toHaveBeenCalledTimes(3);

      const sentEmails = sendEmailSpy.mock.calls.map((call) => call[0].to[0].email);
      expect(sentEmails.sort()).toEqual([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ]);
    });
  });

  describe('Unsubscribe Management & Opt-Out Enforcement', () => {
    it('unsubscribes and resubscribes an email cleanly', async () => {
      const email = 'client.optout@example.com';

      // Initially not unsubscribed
      expect(await isCustomerEmailUnsubscribed(email, mockRepo)).toBe(false);

      // Unsubscribe
      const unsubResult = await unsubscribeCustomerEmail(email, 'Demande client', mockRepo);
      expect(unsubResult).toBe(true);
      expect(await isCustomerEmailUnsubscribed(email, mockRepo)).toBe(true);

      // Case-insensitive check
      expect(await isCustomerEmailUnsubscribed('CLIENT.OPTOUT@EXAMPLE.COM', mockRepo)).toBe(true);

      // Resubscribe
      const resubResult = await resubscribeCustomerEmail(email, mockRepo);
      expect(resubResult).toBe(true);
      expect(await isCustomerEmailUnsubscribed(email, mockRepo)).toBe(false);
    });

    it('processCampaignBatch cancels and skips sending to an unsubscribed customer', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
        success: true,
        messageId: 'optout-msg',
      });

      // Unsubscribe user2
      await unsubscribeCustomerEmail('user2@example.com', 'Désabonné', mockRepo);

      const campaign: MarketingCampaign = {
        id: 'optout-campaign-1',
        title: 'Campagne avec client désabonné',
        status: 'RUNNING',
        targetTiers: ['SILVER'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-16',
        endDate: '2026-10-23',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Offre exclusive',
        content: 'Profitez de nos offres',
        imageUrl: null,
        stats: { totalTargets: 2, sentCount: 0, failedCount: 0, remainingCount: 2, progressPercentage: 0 },
        recipients: [
          { customerId: 'c1', email: 'user1@example.com', fullName: 'User 1', tier: 'SILVER', status: 'PENDING' },
          { customerId: 'c2', email: 'user2@example.com', fullName: 'User 2 (Unsubscribed)', tier: 'SILVER', status: 'PENDING' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      await mockRepo.save(campaign);

      const result = await processCampaignBatch('optout-campaign-1', mockRepo);
      expect(result).not.toBeNull();
      // Only 1 email was sent (to user1)
      expect(result!.sentInBatch).toBe(1);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy.mock.calls[0][0].to[0].email).toBe('user1@example.com');

      const updated = await mockRepo.getById('optout-campaign-1');
      const user2Recipient = updated?.recipients.find((r) => r.customerId === 'c2');
      expect(user2Recipient?.status).toBe('CANCELLED');
    });

    it('email template includes discreet unsubscribe link at the bottom', () => {
      const html = renderDealEmailHtml({
        customerName: 'Samir',
        tier: 'VIP',
        subject: 'Bons plans VIP',
        content: 'Découvrez nos offres',
        storeName: 'Super Market Calais',
        storeAddress: '205 Avenue Saint-Exupéry',
        unsubscribeUrl: 'https://supermarketcalais.com/unsubscribe?email=samir%40test.com',
      });

      // Must be at the bottom and contain the unsubscribe link
      expect(html).toContain('https://supermarketcalais.com/unsubscribe?email=samir%40test.com');
      expect(html).toContain('Se désinscrire');
      expect(html).toContain('font-size: 10px');
    });
  });

  describe('Per-campaign send lock', () => {
    function lockCampaign(id: string): MarketingCampaign {
      return {
        id,
        title: 'Lock test',
        status: 'RUNNING',
        targetTiers: ['GOLD'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-01-01',
        endDate: '2099-12-31',
        scheduledTime: '00:00',
        lastRunDate: null,
        subject: 'Offre',
        content: 'Contenu de la campagne de test.',
        imageUrl: null,
        stats: { totalTargets: 1, sentCount: 0, failedCount: 0, remainingCount: 1, progressPercentage: 0 },
        recipients: [
          { customerId: 'c1', email: 'one@example.com', fullName: 'Client Un', tier: 'GOLD', status: 'PENDING' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        completedAt: null,
      };
    }

    it('refuses a second run while another one holds the campaign, and sends nothing', async () => {
      await mockRepo.save(lockCampaign('busy-1'));
      await mockRepo.tryLock('busy-1');
      const send = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

      await expect(processCampaignBatch('busy-1', mockRepo)).rejects.toBeInstanceOf(CampaignBusyError);
      expect(send).not.toHaveBeenCalled();
    });

    it('releases the campaign after a run, even when the run fails', async () => {
      await mockRepo.save(lockCampaign('release-1'));
      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });
      await processCampaignBatch('release-1', mockRepo);
      expect(mockRepo.locks.has('release-1')).toBe(false);

      await mockRepo.save(lockCampaign('release-2'));
      vi.spyOn(mockRepo, 'getUnsubscribedEmails').mockRejectedValueOnce(new Error('db down'));
      await expect(processCampaignBatch('release-2', mockRepo)).rejects.toThrow('db down');
      expect(mockRepo.locks.has('release-2')).toBe(false);
    });

    it('returns null for an unknown campaign instead of reporting it busy', async () => {
      await expect(processCampaignBatch('missing', mockRepo)).resolves.toBeNull();
    });

    it('skips a busy campaign in the scheduled run without failing the others', async () => {
      await mockRepo.save(lockCampaign('busy-2'));
      await mockRepo.save(lockCampaign('free-1'));
      await mockRepo.tryLock('busy-2');
      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true });

      const results = await triggerDueCampaigns(mockRepo);
      expect(results.map((r) => r.campaignId)).toEqual(['free-1']);
    });
  });
});

describe('countAudienceByTier', () => {
  it('asks the database for the counts with the tier thresholds from LOYALTY_CONFIG', async () => {
    const counts = { BRONZE: 12, SILVER: 5, GOLD: 3, VIP: 1 };
    const audience: ICampaignAudienceRepository = {
      listCustomersWithEmail: vi.fn(),
      countByTier: vi.fn().mockResolvedValue(counts),
    };

    await expect(countAudienceByTier(audience)).resolves.toEqual(counts);
    expect(audience.countByTier).toHaveBeenCalledWith({
      silver: LOYALTY_CONFIG.tiers.SILVER.minHistoricalPoints,
      gold: LOYALTY_CONFIG.tiers.GOLD.minHistoricalPoints,
      vip: LOYALTY_CONFIG.tiers.VIP.minHistoricalPoints,
    });
    expect(audience.listCustomersWithEmail).not.toHaveBeenCalled();
  });
});
