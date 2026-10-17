-- ==============================================================================
-- Super Market Calais — Truncate Customers, Cashiers and their Activity
-- ==============================================================================
-- DESCRIPTION:
-- Permanently deletes all operational cashier accounts, customer profiles,
-- and all associated historical activity (transactions, points, marketing logs).
--
-- PRESERVED:
--  - ADMIN accounts (profiles and auth.users) are strictly kept intact.
--  - Application global settings (app_settings) are kept intact.
--  - Marketing campaign templates are kept intact (recipient logs cleared).
--
-- EXECUTION:
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

BEGIN;

-- 1. Truncate all transaction activity (purchases and loyalty point movements)
TRUNCATE TABLE public.transactions CASCADE;

-- 2. Truncate marketing recipient logs and reset campaign stats if present
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'marketing_campaign_recipients'
    ) THEN
        EXECUTE 'TRUNCATE TABLE public.marketing_campaign_recipients CASCADE;';
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'marketing_unsubscribes'
    ) THEN
        EXECUTE 'TRUNCATE TABLE public.marketing_unsubscribes CASCADE;';
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'marketing_campaigns'
    ) THEN
        EXECUTE 'UPDATE public.marketing_campaigns 
                 SET recipients = ''[]''::jsonb, 
                     stats = ''{"totalTargets":0,"sentCount":0,"failedCount":0,"remainingCount":0,"progressPercentage":0}''::jsonb;';
    END IF;
END $$;

-- 3. Truncate all customers loyalty table entries
TRUNCATE TABLE public.customers CASCADE;

-- 4. Identify all non-admin user IDs (Cashiers and Customers only)
CREATE TEMP TABLE temp_non_admin_users ON COMMIT DROP AS
SELECT id FROM public.profiles 
WHERE role IN ('CUSTOMER', 'CASHIER')
UNION
SELECT id FROM auth.users 
WHERE COALESCE(raw_user_meta_data->>'role', '') IN ('CUSTOMER', 'CASHIER');

-- 5. Delete Cashiers and Customers from public.profiles (Strict protection of ADMIN)
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM temp_non_admin_users)
  AND role != 'ADMIN';

-- 6. Delete authentication identities for these users
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM temp_non_admin_users)
  AND user_id NOT IN (SELECT id FROM public.profiles WHERE role = 'ADMIN');

-- 7. Delete auth credentials from auth.users (cascades sessions, tokens, etc.)
DELETE FROM auth.users
WHERE id IN (SELECT id FROM temp_non_admin_users)
  AND id NOT IN (SELECT id FROM public.profiles WHERE role = 'ADMIN');

COMMIT;

-- ==============================================================================
-- Verification Summary (Displays remaining counts after execution)
-- ==============================================================================
SELECT 'Profiles remaining' AS entity, COALESCE(role::text, 'UNKNOWN') AS role_or_type, count(*)::text AS count 
FROM public.profiles 
GROUP BY role
UNION ALL
SELECT 'Customers table', 'ACTIVE_CUSTOMERS', count(*)::text FROM public.customers
UNION ALL
SELECT 'Transactions table', 'TRANSACTIONS', count(*)::text FROM public.transactions
UNION ALL
SELECT 'Auth users remaining', 'AUTH_USERS', count(*)::text FROM auth.users;
