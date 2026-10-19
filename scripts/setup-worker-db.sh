#!/usr/bin/env bash
# =============================================================================
# Creates (or updates) the limited Postgres user of the background jobs (pg-boss,
# running inside the Next.js app) and prints the full DATABASE_URL to set on the app.
#
# Run on the VPS, where the Supabase containers run:
#   bash scripts/setup-worker-db.sh
# Or from your machine, without copying the file:
#   ssh root@<vps> 'bash -s' < scripts/setup-worker-db.sh
#
# Every run sets a NEW password (Postgres only stores a hash, it cannot be read
# back). A running app keeps working until it reconnects, so update its
# DATABASE_URL and redeploy it right after.
#
# Options (environment variables):
#   DB_CONTAINER_FILTER  docker name filter of the database container (default: supabase-db)
#   DB_HOST              host the app uses to reach Postgres (default: supabase-db)
#   DB_PORT              (default: 5432)
#   DB_NAME              (default: postgres)
#   WORKER_ROLE          (default: pgboss_worker)
# =============================================================================
set -euo pipefail

DB_CONTAINER_FILTER="${DB_CONTAINER_FILTER:-supabase-db}"
DB_HOST="${DB_HOST:-supabase-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
WORKER_ROLE="${WORKER_ROLE:-pgboss_worker}"

log() { echo "[setup-worker-db] $*" >&2; }
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

# --- Generate a password (hex: no URL-encoding needed) -----------------------
if command -v openssl >/dev/null; then
  PASSWORD="$(openssl rand -hex 24)"
else
  PASSWORD="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
fi
[ "${#PASSWORD}" -eq 48 ] || fail "could not generate a password."

# --- Create the role if missing, set its password, grant schema creation -----
# The password travels through the environment (not the command line, visible in `ps`)
# and reaches the SQL as a psql variable (:'pw'), never pasted into the SQL text.
log "creating/updating role '${WORKER_ROLE}'..."
WORKER_DB_PASSWORD="$PASSWORD" docker exec -i -e WORKER_DB_PASSWORD "$DB_CONTAINER" \
  psql -q -U supabase_admin -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -v role="$WORKER_ROLE" -v db="$DB_NAME" >/dev/null <<'SQL'
\getenv pw WORKER_DB_PASSWORD
SELECT format('CREATE ROLE %I LOGIN', :'role')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role') \gexec
ALTER ROLE :"role" WITH LOGIN PASSWORD :'pw';
GRANT CONNECT, CREATE ON DATABASE :"db" TO :"role";
SQL

# --- Check the password works over TCP, like the app connects ----------------
log "checking login..."
current_user="$(PGPASSWORD="$PASSWORD" docker exec -i -e PGPASSWORD "$DB_CONTAINER" \
  psql -h 127.0.0.1 -p "$DB_PORT" -U "$WORKER_ROLE" -d "$DB_NAME" -tAc "SELECT current_user;")" \
  || fail "the new password was set but login failed. Check pg_hba.conf for TCP connections."
[ "$current_user" = "$WORKER_ROLE" ] || fail "unexpected login result: '${current_user}'."
log "OK: '${WORKER_ROLE}' can log in."

# --- Output: the only line on stdout, so it can be captured -------------------
echo "DATABASE_URL=postgres://${WORKER_ROLE}:${PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
log "set this DATABASE_URL on the app, then redeploy it."
