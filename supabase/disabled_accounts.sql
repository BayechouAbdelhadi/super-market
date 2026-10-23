-- =========================================================================
-- Staff account deactivation (admin can disable / re-enable cashiers)
-- =========================================================================
-- Sign-in is blocked by an auth ban (set by the app with the service role).
-- profiles.disabled_at records the state for display and for RLS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz NULL;

-- A disabled account has no role for RLS purposes: its open sessions lose
-- all role-based database access immediately.
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND disabled_at IS NULL;
$$;

-- Users must not be able to re-enable themselves through their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  AND disabled_at IS NOT DISTINCT FROM (SELECT disabled_at FROM profiles WHERE id = auth.uid())
);
