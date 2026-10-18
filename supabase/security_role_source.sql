-- =========================================================================
-- SECURITY MIGRATION: role source of truth = public.profiles.role
-- =========================================================================
-- The application no longer reads roles from auth.users.raw_user_meta_data
-- (user_metadata), because any user can rewrite it from the browser with the
-- public anon key. Roles are now read from public.profiles.role, then from
-- auth.users.raw_app_meta_data (app_metadata, service-role only).
--
-- RUN STEP 1 BEFORE DEPLOYING. Every row it returns is an account whose
-- access would change after the deploy.
-- =========================================================================

-- STEP 1 — Accounts whose metadata role differs from their profile role
-- (or that have no profile row at all).
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' AS metadata_role,
  p.role                          AS profile_role,
  u.raw_app_meta_data ->> 'role'  AS app_metadata_role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
   OR COALESCE(u.raw_user_meta_data ->> 'role', 'CUSTOMER') <> p.role::text
ORDER BY u.created_at;

-- STEP 2 — For each LEGITIMATE staff account returned above (for example the
-- admin created by create_admin.sql, which has no profile row), create or fix
-- its profile. Review every email by hand: a metadata role may have been
-- forged, so never copy metadata roles in bulk.
--
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- SELECT u.id, lower(u.email),
--        u.raw_user_meta_data ->> 'first_name',
--        u.raw_user_meta_data ->> 'last_name',
--        'ADMIN'
-- FROM auth.users u
-- WHERE lower(u.email) = 'admin@supermarket.com'   -- <- the real admin email
-- ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
