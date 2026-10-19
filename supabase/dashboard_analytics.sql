-- =========================================================================
-- Dashboard analytics: KPI totals and the daily sales trend, aggregated in
-- PostgreSQL. SECURITY INVOKER, so the caller's transactions RLS still applies
-- (the app only calls these for ADMIN).
-- =========================================================================
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions (created_at DESC);

CREATE OR REPLACE FUNCTION public.dashboard_transaction_totals(p_today_start TIMESTAMPTZ)
RETURNS TABLE (
  revenue_today NUMERIC,
  sales_today BIGINT,
  points_earned_today BIGINT,
  points_redeemed_today BIGINT,
  revenue_total NUMERIC,
  sales_total BIGINT,
  points_earned_total BIGINT,
  points_redeemed_total BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount_total) FILTER (WHERE created_at >= p_today_start), 0),
    COUNT(*) FILTER (WHERE created_at >= p_today_start),
    COALESCE(SUM(points_earned) FILTER (WHERE created_at >= p_today_start), 0)::BIGINT,
    COALESCE(SUM(points_redeemed) FILTER (WHERE created_at >= p_today_start), 0)::BIGINT,
    COALESCE(SUM(amount_total), 0),
    COUNT(*),
    COALESCE(SUM(points_earned), 0)::BIGINT,
    COALESCE(SUM(points_redeemed), 0)::BIGINT
  FROM public.transactions;
$$;

-- One row per local calendar day (in p_tz) that has transactions since p_since.
CREATE OR REPLACE FUNCTION public.dashboard_daily_sales(p_since TIMESTAMPTZ, p_tz TEXT)
RETURNS TABLE (
  day DATE,
  revenue NUMERIC,
  sales_count BIGINT,
  points_earned BIGINT,
  points_redeemed BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (created_at AT TIME ZONE p_tz)::DATE AS day,
    COALESCE(SUM(amount_total), 0),
    COUNT(*),
    COALESCE(SUM(points_earned), 0)::BIGINT,
    COALESCE(SUM(points_redeemed), 0)::BIGINT
  FROM public.transactions
  WHERE created_at >= p_since
  GROUP BY 1
  ORDER BY 1;
$$;

REVOKE EXECUTE ON FUNCTION public.dashboard_transaction_totals(TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_daily_sales(TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_transaction_totals(TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_daily_sales(TIMESTAMPTZ, TEXT) TO authenticated;

-- Make PostgREST pick up the new functions right away
NOTIFY pgrst, 'reload schema';
