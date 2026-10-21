-- Table: site_alerts (bannières d'alerte affichées en haut du site public)
CREATE TABLE IF NOT EXISTS site_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'CRITICAL')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT
);

-- Liste admin (plus récentes d'abord) et bannières actives
CREATE INDEX IF NOT EXISTS site_alerts_created_at_idx ON site_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS site_alerts_active_idx ON site_alerts (created_at DESC) WHERE is_active;

-- Active la sécurité niveau ligne (RLS). Le site lit les alertes côté serveur (service role) :
-- aucun accès direct pour les visiteurs.
ALTER TABLE site_alerts ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs peuvent lire et modifier les alertes
DROP POLICY IF EXISTS "Only admins can manage site_alerts" ON site_alerts;
CREATE POLICY "Only admins can manage site_alerts"
    ON site_alerts
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );
