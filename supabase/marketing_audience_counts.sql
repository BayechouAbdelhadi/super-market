-- =========================================================================
-- Campaign audience size per loyalty tier, counted in PostgreSQL.
-- Same rules as the real send (getTargetCustomersByTiers in lib/marketing/service.ts):
--   * CUSTOMER profiles whose email contains "@"
--   * not in marketing_unsubscribes (compared on lower(trim(email)))
--   * one per email, case-insensitive (the lowest profile id wins, like the app's paging order)
--   * tier = customers.status, or derived from loyalty_points with the thresholds passed in
--     (the app passes LOYALTY_CONFIG, so the thresholds live in one place)
-- SECURITY INVOKER: the caller's RLS on profiles / customers / marketing_unsubscribes applies
-- (the app only calls it for ADMIN).
-- Apply BEFORE deploying the code that uses it. Safe to run again.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.marketing_audience_counts(
  p_silver_min INTEGER,
  p_gold_min INTEGER,
  p_vip_min INTEGER
)
RETURNS TABLE (tier TEXT, recipients BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH audience AS (
    SELECT DISTINCT ON (lower(trim(p.email)))
      COALESCE(
        NULLIF(c.status, ''),
        CASE
          WHEN COALESCE(c.loyalty_points, 0) >= p_vip_min THEN 'VIP'
          WHEN COALESCE(c.loyalty_points, 0) >= p_gold_min THEN 'GOLD'
          WHEN COALESCE(c.loyalty_points, 0) >= p_silver_min THEN 'SILVER'
          ELSE 'BRONZE'
        END
      ) AS tier
    FROM public.profiles p
    LEFT JOIN public.customers c ON c.id = p.id
    WHERE p.role = 'CUSTOMER'
      AND p.email LIKE '%@%'
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_unsubscribes u
        WHERE lower(u.email) = lower(trim(p.email))
      )
    ORDER BY lower(trim(p.email)), p.id
  )
  SELECT tier, COUNT(*) AS recipients
  FROM audience
  GROUP BY tier;
$$;

-- Make PostgREST pick up the new function right away
NOTIFY pgrst, 'reload schema';
