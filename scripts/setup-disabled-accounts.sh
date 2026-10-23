#!/usr/bin/env bash
# =============================================================================
# Creates the database objects of the account deactivation feature
# (same SQL as supabase/disabled_accounts.sql):
#   - column profiles.disabled_at
#   - function get_current_user_role() ignoring disabled accounts
#   - policy "Users can update their own profile" (cannot re-enable oneself)
# Safe to run several times.
#
# Run on the VPS, where the Supabase containers run:
#   bash scripts/setup-disabled-accounts.sh
# Or from your machine, without copying the file:
#   ssh root@<vps> 'bash -s' < scripts/setup-disabled-accounts.sh
#
# Options (environment variables):
#   DB_CONTAINER_FILTER  docker name filter of the database container (default: supabase-db)
#   DB_NAME              (default: postgres)
# =============================================================================
set -euo pipefail

DB_CONTAINER_FILTER="${DB_CONTAINER_FILTER:-supabase-db}"
DB_NAME="${DB_NAME:-postgres}"

log() { echo "[setup-disabled-accounts] $*" >&2; }
fail() { log "ERROR: $*"; exit 1; }

command -v docker >/dev/null || fail "docker is not installed or not in PATH."

# --- Find the database container (exactly one) -------------------------------
mapfile -t containers < <(docker ps -qf "name=${DB_CONTAINER_FILTER}")
if [ "${#containers[@]}" -eq 0 ]; then
  fail "no running container matches '${DB_CONTAINER_FILTER}'. Check 'docker ps' and set DB_CONTAINER_FILTER."
elif [ "${#containers[@]}" -gt 1 ]; then
  fail "several containers match '${DB_CONTAINER_FILTER}'. Set DB_CONTAINER_FILTER to a more precise name."
fi
DB_CONTAINER="${containers[0]}"
log "database container: $(docker ps --format '{{.Names}}' -f "id=${DB_CONTAINER}")"

# --- Apply the migration in one transaction ----------------------------------
log "creating column, function and policy..."
docker exec -i "$DB_CONTAINER" \
  psql -q -U supabase_admin -d "$DB_NAME" -v ON_ERROR_STOP=1 --single-transaction >/dev/null <<'SQL'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz NULL;

-- A disabled account has no role for RLS purposes: its open sessions lose
-- all role-based database access immediately.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND disabled_at IS NULL;
$$;

-- Users must not be able to re-enable themselves through their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  AND disabled_at IS NOT DISTINCT FROM (SELECT disabled_at FROM profiles WHERE id = auth.uid())
);
SQL

# --- Check ---------------------------------------------------------------------
has_column="$(docker exec -i "$DB_CONTAINER" psql -U supabase_admin -d "$DB_NAME" -tAc \
  "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='disabled_at';")"
[ "$has_column" = "1" ] || fail "column profiles.disabled_at not found after migration."
log "OK: account deactivation is set up."
