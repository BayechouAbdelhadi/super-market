-- Table: app_settings (Configuration globale de l'application)
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    settings_json JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by TEXT
);

-- Active la sécurité niveau ligne (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Lecture : Les administrateurs et caissiers peuvent consulter la configuration
CREATE POLICY "Admins and cashiers can read app_settings"
    ON app_settings
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'CASHIER')
        )
    );

-- Écriture : Seuls les administrateurs peuvent modifier la configuration
CREATE POLICY "Only admins can modify app_settings"
    ON app_settings
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );
