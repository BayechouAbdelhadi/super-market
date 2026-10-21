# Deploying on Coolify

This guide covers everything production needs: the Supabase service, the database scripts, the Next.js app's settings and environment variables, and the background jobs that send scheduled campaigns. It reflects the setup on the production VPS (`srv2036440`).

## Architecture

```
                 Internet
                    │
          coolify-proxy (Traefik)
                    │ HTTPS
     ┌──────────────┴──────────────── network: coolify ─────────────┐
     │                                                              │
     │  Next.js app (Coolify application, Railpack)                 │
     │   ├─ web pages and API routes                                │
     │   └─ background jobs (pg-boss, started by instrumentation.ts)│
     │          │ Supabase API (HTTPS)        │ Postgres (5432)     │
     └──────────┼─────────────────────────────┼─────────────────────┘
                ▼                             ▼
     Supabase service (Coolify service, network favbqfgc12suknxxsmfowtza,
     also attached to coolify)
       supabase-kong ─ supabase-rest / auth / storage ─ supabase-db
```

- The app reads and writes data through the **Supabase API** (Kong), with the anon and service-role keys.
- Only the **background jobs** connect to Postgres directly, with their own limited user, `pgboss_worker`. They store their queue in the `pgboss` schema.
- Coolify names containers with a suffix: on this server the database container is `supabase-db-favbqfgc12suknxxsmfowtza`, and the Supabase network is `favbqfgc12suknxxsmfowtza`. Find yours with `docker ps --format '{{.Names}}' | grep supabase-db`.

## 1. Supabase service

### Connect it to Coolify's network

The app runs on the `coolify` network. The database must join that network, or the background jobs fail with `getaddrinfo EAI_AGAIN supabase-db-…`.

1. In Coolify, open the **Supabase service**.
2. Enable **Connect To Predefined Network**, then save.
3. Redeploy the service. Supabase is briefly unavailable while it restarts.

Check on the server:

```bash
docker inspect -f '{{range $n, $c := .NetworkSettings.Networks}}{{$n}} {{end}}' $(docker ps -qf name=supabase-db)
```

The output must include `coolify`.

**Quick alternative, not permanent:** `docker network connect coolify supabase-db-favbqfgc12suknxxsmfowtza` attaches the database immediately, with no restart. It is lost the next time Coolify recreates the Supabase containers, so always enable the Coolify setting as well.

### Security settings to keep

- **Kong's `/pg/` route stays removed.** It let anyone with the dashboard password run SQL over HTTP. `/pg/query` must return `401`.
- **Studio is removed.** Run SQL from the server with `docker exec` instead (next section).
- **Postgres port 5432 is not published** on the host. The database is reachable only from Docker networks.

## 2. Database scripts

The SQL scripts live in [`supabase/`](../supabase). Run them as `supabase_admin`, the user that owns the tables. The `postgres` user fails with `must be owner of table …`.

From your machine, in the project folder:

```bash
ssh root@<vps-ip> 'docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1' < supabase/<script>.sql
```

Or on the server, paste the SQL between `<<'SQL'` and `SQL`:

```bash
docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 <<'SQL'
-- SQL here
SQL
```

Keep the quotes in `<<'SQL'`. Without them, bash rewrites the `$$` in function bodies.

| Script | Purpose | When |
| --- | --- | --- |
| `tables.sql` | Roles enum, `profiles`, `customers`, `transactions` | New database only |
| `roles_and_rls.sql` | Row Level Security policies | New database only |
| `security_role_source.sql` | Roles read from `profiles.role`, never from user metadata | New database only |
| `settings.sql` | `app_settings` table | New database only |
| `marketing.sql` | Campaign tables | New database only |
| `marketing_unsubscribes.sql` | Persistent marketing opt-outs (GDPR) | Applied |
| `auth_token_uses.sql` | Single-use activation and reset links | Applied |
| `rate_limits.sql` | Shared rate limiting | Applied |
| `dashboard_analytics.sql` | Dashboard KPIs and 7-day trend computed in SQL | Applied |
| `campaign_locks.sql` | Per-campaign send lock, so a campaign is never sent by two runs at once | **Before** deploying the code that uses it |
| `site_alerts.sql` | Alert banners shown at the top of the public site | **Before** deploying the code that uses it |
| `storage_rls.sql` | Storage bucket policies | New database only |
| `create_admin.sql` | First admin account (edit email and password first) | New database only |
| `update_admin_password.sql` | Reset the admin password | When needed |
| `truncate_customers_cashiers_activity.sql` | **Deletes all customers, cashiers and their activity** | Never in production |

"Applied" means the script has been run on production. Running it again is safe: these scripts use `IF NOT EXISTS` and `CREATE OR REPLACE`.

## 3. Background jobs database user

The jobs connect with `pgboss_worker`, a user that can create and own the `pgboss` schema and has no access to the app's tables.

Run [`scripts/setup-worker-db.sh`](../scripts/setup-worker-db.sh) from your machine, in the project folder:

```bash
ssh root@<vps-ip> 'DB_CONTAINER_FILTER=supabase-db-favbqfgc12suknxxsmfowtza DB_HOST=supabase-db-favbqfgc12suknxxsmfowtza bash -s' < scripts/setup-worker-db.sh
```

It creates the user if needed, sets a new random password, checks the login, and prints:

```
DATABASE_URL=postgres://pgboss_worker:<48 hex characters>@supabase-db-favbqfgc12suknxxsmfowtza:5432/postgres
```

- **Every run sets a new password.** Postgres stores only a hash, so the current password can't be read back. After a run, update `DATABASE_URL` in Coolify and redeploy the app.
- **Use the full container name as the host.** The short name `supabase-db` only works inside the Supabase network.

The user lives in the database volume, so it survives Supabase redeploys and updates.

## 4. Next.js app in Coolify

### Build

| Setting | Value |
| --- | --- |
| Build pack | Railpack |
| Repository branch | `master` |
| Build command | `npm run build` (default) |
| Start command | `npm run start` (default) |
| Port | `3000` |
| Domain | Your public domain, e.g. `https://supermarketcalais.com` |

The `Dockerfile` in the repository is not used by this Coolify setup. It stays for building the image without Coolify.

### Environment variables

Set these on the app in Coolify (**Environment Variables**).

| Variable | Required | Build variable | Value |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | **Yes** | Public URL of Supabase's Kong, e.g. `https://supabase.supermarketcalais.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | **Yes** | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | No | Supabase service-role key. Server only. |
| `NEXT_PUBLIC_APP_URL` | Yes | **Yes** | `https://supermarketcalais.com`. Used in emailed links, and as the canonical URL for SEO (sitemap, share previews, QR codes) |
| `AUTH_TOKEN_SECRET` | Yes | No | 64 hex characters: `openssl rand -hex 32`. Signs activation, reset and unsubscribe links. |
| `NEXT_BREVO_API_KEY` | Yes | No | Brevo API key. Keep it set even with `AUTH_TOKEN_SECRET`: links emailed before the switch were signed with it. |
| `BREVO_SENDER_EMAIL` | Yes | No | A sender verified in Brevo |
| `BREVO_SENDER_NAME` | Yes | No | `Super Market Calais` |
| `DATABASE_URL` | Yes | No | The value printed in step 3 |
| `APP_URL` | No | No | Server-side override of `NEXT_PUBLIC_APP_URL` |
| `GOOGLE_SITE_VERIFICATION` | No | **Yes** | Google Search Console code ("HTML tag" method, the `content` value only) |
| `BING_SITE_VERIFICATION` | No | **Yes** | Bing Webmaster Tools code (`msvalidate.01` tag, the `content` value only) |

**Build variable:** Next.js writes `NEXT_PUBLIC_*` values into the browser code during the build. Tick **Build Variable** (sometimes "Available at Buildtime") for them, or the browser gets empty values. Changing one requires a rebuild, not just a restart.

**Entering values:** in the normal form, the **name** goes in one field and the **value** in the other. The value must not repeat the name.

| Field | Correct | Wrong |
| --- | --- | --- |
| Name | `DATABASE_URL` | |
| Value | `postgres://pgboss_worker:…@supabase-db-…:5432/postgres` | `DATABASE_URL=postgres://…` |

A value with the name prefix, quotes or spaces makes the jobs log `DATABASE_URL must start with "postgres://"` (or, on older builds, `EAI_AGAIN base`). In Coolify's **Developer view**, a bulk `.env`-style text box, the full `NAME=value` line is correct.

Variables to **leave unset** in production: `JOBS_IN_DEV` and `ALLOWED_DEV_ORIGINS` (development only).

### Deploy

Push to `master`, or click **Redeploy** in Coolify. Coolify builds a new container, switches traffic to it, then stops the old one. The background jobs handle the overlap: only one campaign run can be active at a time.

## 5. Check the deployment

Run on the server. Store the app container first, since Coolify gives it a new name on each deploy:

```bash
APP=$(docker ps -qf name=hyid8nf2xp8mbbstrjtmaehd | head -1)
```

`hyid8nf2xp8mbbstrjtmaehd` is the app's Coolify ID, the prefix of its container names.

**1. The database is on the app's network:**

```bash
docker exec $APP node -e 'require("dns").lookup("supabase-db-favbqfgc12suknxxsmfowtza", (e, a) => console.log(e ? "NOT reachable: " + e.code : "resolves to " + a));'
```

Expected: `resolves to 10.x.x.x`.

**2. `DATABASE_URL` is well formed** (password hidden):

```bash
docker exec $APP printenv DATABASE_URL | sed -E 's#(://[^:]*):[^@]*@#\1:***@#'
```

Expected: `postgres://pgboss_worker:***@supabase-db-favbqfgc12suknxxsmfowtza:5432/postgres`, starting with `postgres://`.

**3. The jobs started:**

```bash
docker logs $APP 2>&1 | grep "\[jobs\]" | tail -3
```

Expected: `[jobs] started: "marketing-due-campaigns" runs on "* * * * *" (Europe/Paris)`. When a campaign goes out: `[jobs] 1 campaign(s) processed: 120 sent, 0 failed`.

**4. The jobs run every minute:**

```bash
docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -c \
  "SELECT state, count(*), max(created_on) AS last FROM pgboss.job WHERE name = 'marketing-due-campaigns' GROUP BY state;"
```

Expected: `completed` grows by about one per minute, and `last` is under a minute old.

**5. The dashboard functions exist:**

```bash
docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -c \
  "SELECT * FROM dashboard_transaction_totals(date_trunc('day', now()));"
```

Expected: one row of numbers, not `function … does not exist`.

**Inspecting variables safely:** to list what the app received, show names only:

```bash
docker exec $APP printenv | cut -d= -f1 | sort
```

Plain `printenv` and `docker inspect` print every secret in clear text. Don't paste their output anywhere.

## 6. After updating or redeploying Supabase

When Coolify updates the Supabase service (new image versions, settings change, redeploy):

1. **Network:** check step 5.1. If the database is no longer on `coolify`, the **Connect To Predefined Network** setting is off. Enable it and redeploy the service.
2. **Kong:** check that `/pg/query` still returns `401`. An update of Kong's config template can bring the route back.
3. **Jobs:** nothing to do. The app retries the connection every 60 seconds and reconnects by itself. Check `[jobs] started` in the logs (step 5.3) if campaigns stop.
4. **Data and users:** the database volume is kept. `pgboss_worker`, its password and the `pgboss` schema survive.

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `[jobs] failed to start … EAI_AGAIN supabase-db-…` or `ENOTFOUND` | The database isn't on the `coolify` network | Section 1 |
| `[jobs] not started: DATABASE_URL must start with "postgres://"` | The value includes `DATABASE_URL=`, quotes or spaces | Section 4, "Entering values" |
| `[jobs] failed to start … EAI_AGAIN base` | Same as above, on an older build | Same |
| `[jobs] not started: set DATABASE_URL …` | Variable missing on the app | Section 3, then section 4 |
| `[jobs] failed to start … password authentication failed` | Password doesn't match | Run the setup script again, update `DATABASE_URL`, redeploy |
| `NOTICE: empty string is not a valid password` when creating the user by hand | The password variable was empty | Use the setup script, which sets the password safely |
| `ERROR: must be owner of table …` when running SQL | Ran as `postgres` | Run as `supabase_admin` |
| Dashboard shows zeros | `dashboard_analytics.sql` not applied, or no transactions | Section 2, then check 5.5 |
| Browser errors about Supabase URL or key | `NEXT_PUBLIC_*` not set as build variables | Tick **Build Variable**, then redeploy |
| Campaign not sent, `[jobs] started` is logged | The campaign isn't due | It must not be `DRAFT` or `PAUSED`, its dates must include today, recipients must remain, and its time must have passed in Paris time |

More on how the jobs work: [`background-jobs.md`](background-jobs.md).
