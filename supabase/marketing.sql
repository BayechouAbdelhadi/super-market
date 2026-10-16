-- ==============================================================================
-- Super Market Calais — Marketing Campaigns & Loyalty Deals (Supabase Migration)
-- ==============================================================================

-- 1. Table: marketing_campaigns (Jobs de programmation d'e-mails bons plans)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'
    target_tiers TEXT[] NOT NULL DEFAULT '{}', -- Paliers ciblés: 'BRONZE', 'SILVER', 'GOLD', 'VIP'
    dispatch_mode TEXT NOT NULL DEFAULT 'ALL_AT_ONCE', -- 'ALL_AT_ONCE' ou 'DAILY_LIMIT'
    daily_limit INTEGER, -- Quota par jour si DAILY_LIMIT (ex. 100)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL DEFAULT '00:00', -- Heure d'exécution automatique (00:00 = Minuit)
    last_run_date DATE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    cta_text TEXT DEFAULT 'Découvrir les offres en magasin',
    cta_url TEXT DEFAULT 'https://supermarket-calais.fr',
    stats JSONB NOT NULL DEFAULT '{"totalTargets":0,"sentCount":0,"failedCount":0,"remainingCount":0,"progressPercentage":0}'::jsonb,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les filtres de statut et les tris chronologiques
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON marketing_campaigns(created_at DESC);

-- 2. Table: marketing_campaign_recipients (Destinataires individuels & suivi d'envoi)
CREATE TABLE IF NOT EXISTS marketing_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
    sent_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour requêtes par job et par statut de livraison
CREATE INDEX IF NOT EXISTS idx_marketing_recipients_campaign_id ON marketing_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_recipients_status ON marketing_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_marketing_recipients_customer ON marketing_campaign_recipients(customer_id);

-- Contrainte d'unicité absolue : un client ou e-mail ne peut JAMAIS être dupliqué dans la même campagne
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_recipients_unique_campaign_customer 
    ON marketing_campaign_recipients(campaign_id, customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_recipients_unique_campaign_email 
    ON marketing_campaign_recipients(campaign_id, lower(email));

-- 3. Table: marketing_unsubscribes (Désabonnements & Opt-out marketing)
CREATE TABLE IF NOT EXISTS marketing_unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    customer_id UUID,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_unsubscribes_email ON marketing_unsubscribes(lower(email));
CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_customer ON marketing_unsubscribes(customer_id);

-- 4. Row Level Security (RLS)
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs et le rôle de service peuvent lire et écrire les campagnes
CREATE POLICY "Admins have full access to marketing_campaigns"
    ON marketing_campaigns
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins have full access to marketing_campaign_recipients"
    ON marketing_campaign_recipients
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Service role and Admins can manage marketing_unsubscribes"
    ON marketing_unsubscribes
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Allow public / unauthenticated users to insert their unsubscribe request
CREATE POLICY "Public can insert marketing_unsubscribes"
    ON marketing_unsubscribes
    FOR INSERT
    WITH CHECK (true);

-- ==============================================================================
-- 5. Programmation automatique du Job à Minuit (00:00 UTC) via pg_cron
-- ==============================================================================
-- Si l'extension pg_cron est activée dans votre instance Supabase, ce cron
-- exécute automatiquement le traitement des campagnes actives chaque nuit à 00:00.
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--     'marketing-deals-midnight-job',
--     '0 0 * * *', -- Tous les jours à 00:00 (Minuit)
--     $$
--     SELECT net.http_post(
--         url := 'https://api.supermarketcalais.com/api/cron/deals',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
--     );
--     $$
-- );

