import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCampaignSchema } from '@/lib/marketing/validation';
import { renderDealEmailHtml } from '@/lib/marketing/templates/deal-email';
import {
  processCampaignBatch,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
} from '@/lib/marketing/service';
import { IMarketingCampaignRepository } from '@/lib/marketing/ports';
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
}

describe('Marketing Deals & Email Campaigns', () => {
  let mockRepo: MockMarketingRepository;

  beforeEach(() => {
    mockRepo = new MockMarketingRepository();
    vi.clearAllMocks();
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
        ctaUrl: 'https://supermarket-calais.fr/promos',
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
        ctaUrl: 'https://supermarket-calais.fr',
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

    it('persists and retrieves campaign with recipients seamlessly', async () => {
      const { SupabaseMarketingRepository } = await import(
        '@/lib/marketing/adapters/supabase-marketing-repository'
      );
      const repo = new SupabaseMarketingRepository();

      const testCampaign: MarketingCampaign = {
        id: 'supabase-test-job-1',
        title: 'Promotion Supabase Flash',
        status: 'SCHEDULED',
        targetTiers: ['GOLD', 'VIP'],
        dispatchMode: 'ALL_AT_ONCE',
        dailyLimit: null,
        startDate: '2026-10-20',
        endDate: '2026-10-25',
        lastRunDate: null,
        subject: 'Offre exclusive membre VIP',
        content: 'Profitez de 20% de remise sur le rayon fruits et légumes.',
        imageUrl: null,
        ctaText: 'En savoir plus',
        ctaUrl: 'https://supermarket-calais.fr',
        stats: {
          totalTargets: 1,
          sentCount: 0,
          failedCount: 0,
          remainingCount: 1,
          progressPercentage: 0,
        },
        recipients: [
          {
            customerId: 'user-vip-1',
            email: 'vip-member@example.com',
            fullName: 'Membre VIP Test',
            tier: 'VIP',
            status: 'PENDING',
          },
        ],
        createdAt: '2026-10-15T12:00:00Z',
        updatedAt: '2026-10-15T12:00:00Z',
        completedAt: null,
        createdBy: 'admin@supermarket.fr',
      };

      // Save campaign
      const saved = await repo.save(testCampaign);
      expect(saved.id).toBe('supabase-test-job-1');

      // Retrieve by ID
      const retrieved = await repo.getById('supabase-test-job-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Promotion Supabase Flash');
      expect(retrieved?.targetTiers).toEqual(['GOLD', 'VIP']);

      // Retrieve recipients
      const recipients = await repo.getRecipients('supabase-test-job-1');
      expect(recipients.length).toBe(1);
      expect(recipients[0].email).toBe('vip-member@example.com');

      // Update recipient status
      await repo.saveRecipients('supabase-test-job-1', [
        {
          ...recipients[0],
          status: 'SENT',
          sentAt: '2026-10-15T12:05:00Z',
        },
      ]);

      const updatedRecs = await repo.getRecipients('supabase-test-job-1');
      expect(updatedRecs[0].status).toBe('SENT');

      // Clean up test job
      const deleted = await repo.delete('supabase-test-job-1');
      expect(deleted).toBe(true);

      const afterDelete = await repo.getById('supabase-test-job-1');
      expect(afterDelete).toBeNull();
    });
  });
});

