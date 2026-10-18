-- =========================================================================
-- Marketing opt-outs (GDPR): persistent store for unsubscribed emails.
-- Before this table existed, opt-outs were written to a JSON file inside the
-- app container and lost on every redeploy.
-- Written only by the server (service role); no public insert policy.
-- =========================================================================
CREATE TABLE IF NOT EXISTS marketing_unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    customer_id UUID,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_unsubscribes_email ON marketing_unsubscribes(lower(email));
CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_customer ON marketing_unsubscribes(customer_id);

ALTER TABLE marketing_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and Admins can manage marketing_unsubscribes" ON marketing_unsubscribes;
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
