-- Table: news_posts (actualités du magasin, affichées sur le site public façon réseau social)
-- Les photos sont stockées dans le bucket 'super-market' sous news/<id>/ (voir storage_rls.sql) ;
-- la colonne images garde, pour chacune, { path, url, width, height }.
CREATE TABLE IF NOT EXISTS news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
    images JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 4),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT,
    -- Dernière modification du texte ou des photos (NULL si jamais modifiée)
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Une publication a au moins un texte ou une photo
    CONSTRAINT news_posts_not_empty CHECK (char_length(body) > 0 OR jsonb_array_length(images) > 0)
);

-- Pour une table créée avant l'ajout de la modification des publications
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Liste admin (plus récentes d'abord) et fil public (publiées uniquement)
CREATE INDEX IF NOT EXISTS news_posts_created_at_idx ON news_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS news_posts_published_idx ON news_posts (created_at DESC) WHERE is_published;

-- Active la sécurité niveau ligne (RLS). Le site lit les actualités côté serveur (service role) :
-- aucun accès direct pour les visiteurs.
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs peuvent lire et modifier les actualités
DROP POLICY IF EXISTS "Only admins can manage news_posts" ON news_posts;
CREATE POLICY "Only admins can manage news_posts"
    ON news_posts
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );
