# Background jobs

Scheduled marketing campaigns are sent by background jobs that run **inside the Next.js server process**. No separate app or container is needed.

Every minute, in Paris time, the jobs send the campaigns whose send time (`HH:mm`) has arrived. Web requests never send campaigns. An admin can still send a batch by hand with the "run" button.

| Item | Where |
| --- | --- |
| Startup hook | [`instrumentation.ts`](../instrumentation.ts) |
| Start and stop logic | [`lib/jobs/start.ts`](../lib/jobs/start.ts) |
| Schedule and queue settings | [`lib/jobs/config.ts`](../lib/jobs/config.ts) |
| Job handler | [`lib/jobs/worker.ts`](../lib/jobs/worker.ts) |
| Database user setup | [`scripts/setup-worker-db.sh`](../scripts/setup-worker-db.sh) |

## How it works

When the Next.js server starts, it calls `register()` in `instrumentation.ts`. In the Node.js runtime, that starts [pg-boss](https://github.com/timgit/pg-boss), a job queue stored in Postgres. Its tables live in their own `pgboss` schema in the Supabase database. The Supabase API does not expose that schema.

- **Schedule:** a cron entry `* * * * *` in `Europe/Paris` enqueues one job per minute.
- **No overlap:** the queue uses the `exclusive` policy. Only one run can be queued or active at a time, even with several app instances or during a rolling deploy.
- **Redeploys:** a run sends a heartbeat every 15 seconds. If the server stops in the middle of a run, the job is retried once its heartbeat is 30 seconds old.
- **Retries:** a failed run is retried twice, 30 seconds apart.
- **Startup never blocks:** if the database is unreachable when the server starts, the site still serves pages, and the jobs retry every 60 seconds.

The jobs read campaigns and send emails through the Supabase API, with `SUPABASE_SERVICE_ROLE_KEY`, like the rest of the app. `DATABASE_URL` is only used for pg-boss's own tables.

### When the jobs run

| Environment | Runs when |
| --- | --- |
| Production (`NODE_ENV=production`) | `DATABASE_URL` is set |
| Development (`next dev`) | `DATABASE_URL` is set **and** `JOBS_IN_DEV=true` |

Development needs the extra flag so that a local `next dev` pointed at production data never sends real campaigns by accident.

If the jobs don't run, the server logs `[jobs] not started: set DATABASE_URL …` at startup.

## Production setup

The app needs a direct connection to the Supabase Postgres container. That takes three steps.

### 1. Put the database on the app's network

The app runs on Coolify's `coolify` Docker network. The Supabase database is on its own stack network, so the app can't reach it yet.

1. In Coolify, open the **Supabase service**.
2. Enable **Connect To Predefined Network**, save, and redeploy the service. Supabase is briefly unavailable while it restarts.
3. Check it on the server:

   ```bash
   docker inspect -f '{{range $n, $c := .NetworkSettings.Networks}}{{$n}} {{end}}' $(docker ps -qf name=supabase-db)
   ```

   The output must include `coolify`.

From the `coolify` network, reach the database by its **full container name**, for example `supabase-db-favbqfgc12suknxxsmfowtza`. Get yours with:

```bash
docker ps --format '{{.Names}}' | grep supabase-db
```

### 2. Create the database user and get `DATABASE_URL`

The jobs connect with a limited user, `pgboss_worker`. That user can create and own the `pgboss` schema, and has no access to the app's tables (`profiles`, `customers`, `transactions`, and so on).

[`scripts/setup-worker-db.sh`](../scripts/setup-worker-db.sh) creates the user, gives it a new random password, checks that it can log in, and prints the full `DATABASE_URL`.

Run it from your machine, in the project folder. Replace the container name with yours from step 1:

```bash
ssh root@<vps-ip> 'DB_CONTAINER_FILTER=supabase-db-favbqfgc12suknxxsmfowtza DB_HOST=supabase-db-favbqfgc12suknxxsmfowtza bash -s' < scripts/setup-worker-db.sh
```

Expected output:

```
[setup-worker-db] database container: supabase-db-favbqfgc12suknxxsmfowtza
[setup-worker-db] creating/updating role 'pgboss_worker'...
[setup-worker-db] checking login...
[setup-worker-db] OK: 'pgboss_worker' can log in.
DATABASE_URL=postgres://pgboss_worker:<48 hex characters>@supabase-db-favbqfgc12suknxxsmfowtza:5432/postgres
[setup-worker-db] set this DATABASE_URL on the app, then redeploy it.
```

The `DATABASE_URL=…` line is the only line printed on standard output, so you can capture it with `> app-db.env`. Keep that file private, delete it once the value is set, and never commit it.

**Every run sets a new password.** Postgres stores only a hash, so an existing password can't be read back. To get a `DATABASE_URL` again, run the script again, then update the app and redeploy.

#### Script options

Set these as environment variables before `bash`:

| Variable | Default | Use |
| --- | --- | --- |
| `DB_CONTAINER_FILTER` | `supabase-db` | Name filter to find the database container (`docker ps`) |
| `DB_HOST` | `supabase-db` | Host name the app uses to reach Postgres |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `postgres` | Database name |
| `WORKER_ROLE` | `pgboss_worker` | Name of the database user |

#### Doing it by hand

If you can't run the script, these commands on the server do the same thing. Run them all in the same terminal session:

```bash
PGBOSS_PASSWORD=$(openssl rand -hex 24)
DB=$(docker ps -qf name=supabase-db)

docker exec -i $DB psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE pgboss_worker LOGIN PASSWORD '$PGBOSS_PASSWORD';
GRANT CONNECT, CREATE ON DATABASE postgres TO pgboss_worker;
SQL

echo "DATABASE_URL=postgres://pgboss_worker:$PGBOSS_PASSWORD@$(docker inspect -f '{{.Name}}' $DB | tr -d /):5432/postgres"
```

If `$PGBOSS_PASSWORD` is empty, Postgres prints `empty string is not a valid password, clearing password` and the user is left without a password. If the user already exists, replace the `CREATE ROLE` line with `ALTER ROLE pgboss_worker PASSWORD '$PGBOSS_PASSWORD';`.

### 3. Set `DATABASE_URL` on the app and redeploy

In Coolify, add `DATABASE_URL` to the Next.js app's environment variables, with the value from step 2. Then redeploy.

## Check it runs

In the app's logs, after startup:

```
[jobs] started: "marketing-due-campaigns" runs on "* * * * *" (Europe/Paris)
```

When a campaign is sent:

```
[jobs] 1 campaign(s) processed: 120 sent, 0 failed
```

To see recent runs in the database:

```bash
docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -c \
  "SELECT state, count(*), max(created_on) AS last FROM pgboss.job WHERE name = 'marketing-due-campaigns' GROUP BY state;"
```

## Local development

1. Set `DATABASE_URL` in `.env` to any local Postgres, for example `postgres://postgres:postgres@localhost:5432/postgres`.
2. Set `JOBS_IN_DEV=true`.
3. Run `npm run dev`.

Only do this when your `.env` points at test data. With production Supabase keys, the jobs send real campaigns to real customers.

## Troubleshooting

| Log line or symptom | Cause and fix |
| --- | --- |
| `[jobs] not started: set DATABASE_URL …` | `DATABASE_URL` is missing on the app. In development, `JOBS_IN_DEV=true` is also missing. |
| `[jobs] not started: DATABASE_URL must start with "postgres://"` | The value in Coolify includes the `DATABASE_URL=` prefix, quotes or spaces. The value must start with `postgres://`. |
| `[jobs] failed to start … EAI_AGAIN base` | Same cause, on a version without that check: the value doesn't start with `postgres://`. |
| `[jobs] failed to start, retrying in 60s: … ENOTFOUND` | The app can't resolve the database host. Do step 1, and use the full container name as the host. |
| `[jobs] failed to start … password authentication failed` | The password doesn't match. Run the setup script again and update `DATABASE_URL`. |
| `[jobs] failed to start … permission denied for database` | The `GRANT` is missing. Run the setup script again. |
| Campaigns are not sent, but `[jobs] started` is logged | Check that the campaign is not `DRAFT` or `PAUSED`, its dates include today, recipients remain, and its send time has passed in Paris time. |
| The setup script finds no container | Run `docker ps` and set `DB_CONTAINER_FILTER` to the database container's name. |
