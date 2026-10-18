-- =========================================================================
-- One-time token registry: makes password-reset and activation links single-use.
-- Accessed only by the server with the service role key (RLS on, no policies).
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.auth_token_uses (
  jti TEXT PRIMARY KEY,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_token_uses_expires_at_idx ON public.auth_token_uses (expires_at);

ALTER TABLE public.auth_token_uses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_token_uses FROM anon, authenticated;
