-- =========================================================================
-- Shared rate limiting (login, signup, OTP, password reset, unsubscribe).
-- One atomic function call per hit; counters survive restarts and are shared
-- by every app instance. Server-only: executable by the service role only.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx ON public.rate_limit_buckets (reset_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_buckets FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key TEXT, p_limit INTEGER, p_window_ms INTEGER)
RETURNS TABLE (allowed BOOLEAN, retry_after_ms BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket public.rate_limit_buckets;
  window_interval INTERVAL := make_interval(secs => p_window_ms / 1000.0);
BEGIN
  INSERT INTO public.rate_limit_buckets AS r (key, count, reset_at)
  VALUES (p_key, 1, now() + window_interval)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.count + 1 END,
    reset_at = CASE WHEN r.reset_at <= now() THEN now() + window_interval ELSE r.reset_at END
  RETURNING * INTO bucket;

  -- Housekeeping on ~1% of calls: drop expired counters
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_buckets WHERE reset_at < now();
  END IF;

  RETURN QUERY SELECT
    bucket.count <= p_limit,
    CASE WHEN bucket.count <= p_limit THEN 0::BIGINT
         ELSE GREATEST(0, (EXTRACT(EPOCH FROM (bucket.reset_at - now())) * 1000)::BIGINT) END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) TO service_role;
