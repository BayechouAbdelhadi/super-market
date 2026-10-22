---
name: db-script
description: Write a database change for this project (new table, column, index, RLS policy or SQL function) as a SQL script in supabase/, document it in docs/deployment-coolify.md and hand the user the command to apply it. Use whenever a change needs the database schema to change.
disable-model-invocation: true
argument-hint: "<what the database change is for>"
---

# Database change: $ARGUMENTS

This project has no migration tool. Each change is a hand-applied SQL script in `supabase/`, run on the production Supabase (self-hosted on the Coolify VPS) by the user. A script that is wrong, or applied after the code that needs it, breaks production.

## 1. Write the script

Create `supabase/<snake_case_name>.sql` (or extend the script that owns the table, when the change belongs there). Start from the closest existing script: `site_alerts.sql` (admin-managed table), `news_posts.sql` (table plus a column added later), `marketing_audience_counts.sql` (SQL function), `marketing_recipients_unique.sql` (indexes on an existing table).

Rules:
- **Safe to run twice.** `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` before `CREATE POLICY`. Production may already have part of it.
- **A header comment** saying what the script is for, which code uses it, and whether it must be applied before that code is deployed. Note anything that makes it fail (existing duplicates, missing table).
- **RLS on every new table**: `ALTER TABLE … ENABLE ROW LEVEL SECURITY` plus policies. The app reads server-side with the service role; staff access goes through `profiles.role` (see the policy in `site_alerts.sql`). Never trust user metadata for roles (`security_role_source.sql`).
- **Constraints in the database too**: `CHECK` for lengths and enums, mirroring the Zod schema in `lib/<feature>/validation.ts`.
- **Indexes** for every list the app pages through (`created_at DESC`, partial index for the published/active filter): list endpoints must be paginated (AGENTS.md § 6).
- **Aggregations as SQL functions** (AGENTS.md § 6), `SECURITY INVOKER` and `SET search_path = public` unless there is a written reason not to.
- End with `NOTIFY pgrst, 'reload schema';` when the change adds or alters something the Supabase API exposes (table, column, function), so PostgREST sees it without a restart.
- No data deletion. A script that deletes or rewrites rows needs the user's explicit request, and says so in capitals in its header.

## 2. Document it

Add a row to the scripts table in `docs/deployment-coolify.md` (section "2. Database scripts"): script, purpose, and when to apply it (`**Before** deploying the code that uses it` for new scripts). Never mark a script "Applied": only the user knows what ran on production.

Check that every file in `supabase/` has a row in that table; add any that is missing.

## 3. Code and tests

- Repository adapter in `lib/<feature>/adapters/`, behind the port in `lib/<feature>/ports.ts`: Supabase calls stay there (AGENTS.md § 1).
- New columns reach the domain types and the Zod schema.
- Tests in `tests/<feature>/` for the domain logic and the adapter's mapping.

## 4. Hand over

Do **not** run the script: production commands are the user's. Finish with:
1. The script path, and a one-line summary of what it changes.
2. The order: apply the script, then deploy the code.
3. The command, from docs/deployment-coolify.md:
   ```bash
   ssh root@<vps-ip> 'docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1' < supabase/<script>.sql
   ```
