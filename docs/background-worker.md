# Background worker

The background worker sends scheduled marketing campaigns. It is a separate Node process, built from the same Docker image as the app.

Every minute, in Paris time, it sends the campaigns whose send time (`HH:mm`) has arrived. Web requests never send campaigns. An admin can still send a batch by hand with the "run" button.

| Item | Where |
| --- | --- |
| Entry point | [`worker/index.ts`](../worker/index.ts) |
| Schedule and queue settings | [`lib/jobs/config.ts`](../lib/jobs/config.ts) |
| Job handler | [`lib/jobs/worker.ts`](../lib/jobs/worker.ts) |
| Database user setup | [`scripts/setup-worker-db.sh`](../scripts/setup-worker-db.sh) |

## How it works

The worker uses [pg-boss](https://github.com/timgit/pg-boss), a job queue stored in Postgres. Its tables live in their own `pgboss` schema in the Supabase database. The Supabase API does not expose that schema.

- **Schedule:** a cron entry `* * * * *` in `Europe/Paris` enqueues one job per minute.
- **No overlap:** the queue uses the `exclusive` policy. Only one run can be queued or active at a time, even with several worker containers.
- **Retries:** a failed run is retried twice, 30 seconds apart. A run active for more than 30 minutes counts as stuck and is retried.
- **Shutdown:** on `SIGTERM`, the worker lets the active run finish, waiting up to 30 seconds.

The worker reads campaigns and sends emails through the Supabase API, with `SUPABASE_SERVICE_ROLE_KEY`, like the app. `DATABASE_URL` is only used for pg-boss's own tables.

## 1. Create the worker's database user

The worker connects to Postgres with a limited user, `pgboss_worker`. That user can create and own the `pgboss` schema, and has no access to the app's tables (`profiles`, `customers`, `transactions`, and so on).

[`scripts/setup-worker-db.sh`](../scripts/setup-worker-db.sh) creates the user, gives it a new random password, checks that it can log in, and prints the full `DATABASE_URL`.

Run it from your machine, in the project folder. The script is sent over SSH, so you don't need to copy it to the server:

```bash
ssh root@<vps-ip> 'bash -s' < scripts/setup-worker-db.sh
```

Or, from a copy of the repository on the server:

```bash
bash scripts/setup-worker-db.sh
```

Expected output:

```
[setup-worker-db] database container: supabase-db-…
[setup-worker-db] creating/updating role 'pgboss_worker'...
[setup-worker-db] checking login...
[setup-worker-db] OK: 'pgboss_worker' can log in.
DATABASE_URL=postgres://pgboss_worker:<48 hex characters>@supabase-db:5432/postgres
[setup-worker-db] set this DATABASE_URL on the worker container, then restart the worker.
```

The `DATABASE_URL=…` line is the only line printed on standard output, so you can capture it:

```bash
ssh root@<vps-ip> 'bash -s' < scripts/setup-worker-db.sh > worker-db.env
```

Keep that file private and delete it once the value is set on the container. Never commit it.

**Every run sets a new password.** Postgres stores only a hash, so an existing password can't be read back. To get a `DATABASE_URL` again, run the script again, then update the worker container and restart it. A worker already running keeps its open connections, but fails at its next reconnect until it has the new value.

### Options

Set these as environment variables before the command when the defaults don't match your setup:

| Variable | Default | Use |
| --- | --- | --- |
| `DB_CONTAINER_FILTER` | `supabase-db` | Name filter to find the database container (`docker ps`) |
| `DB_HOST` | `supabase-db` | Host name the worker uses to reach Postgres |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `postgres` | Database name |
| `WORKER_ROLE` | `pgboss_worker` | Name of the database user |

Example: `DB_HOST=10.0.0.5 bash scripts/setup-worker-db.sh`. Over SSH, put the variables before `bash`: `ssh root@<vps-ip> 'DB_HOST=10.0.0.5 bash -s' < scripts/setup-worker-db.sh`.

### Doing it by hand

If you can't run the script, these commands on the server do the same thing:

```bash
PGBOSS_PASSWORD=$(openssl rand -hex 24)
DB=$(docker ps -qf name=supabase-db)

docker exec -i $DB psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE pgboss_worker LOGIN PASSWORD '$PGBOSS_PASSWORD';
GRANT CONNECT, CREATE ON DATABASE postgres TO pgboss_worker;
SQL

echo "DATABASE_URL=postgres://pgboss_worker:$PGBOSS_PASSWORD@supabase-db:5432/postgres"
```

Run all of them in the same terminal session. If `$PGBOSS_PASSWORD` is empty, Postgres prints `empty string is not a valid password, clearing password` and the user is left without a password. If the user already exists, replace the `CREATE ROLE` line with `ALTER ROLE pgboss_worker PASSWORD '$PGBOSS_PASSWORD';`.

## 2. Deploy the worker container

Run a second container from the app's image:

| Setting | Value |
| --- | --- |
| Image | Same as the app |
| Command | `node worker.mjs` |
| Health check | Disabled. The image's health check calls port 3000, which the worker doesn't serve. |
| Network | The Supabase Docker network, so `supabase-db` resolves |
| Replicas | 1 is enough. More are safe, since runs never overlap. |

Environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The line printed by the script |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as the app |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as the app |
| `NEXT_BREVO_API_KEY` | Same as the app |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Same as the app |
| `AUTH_TOKEN_SECRET` | Same as the app. It signs the unsubscribe links in campaign emails. |
| `NEXT_PUBLIC_APP_URL` | Same as the app |

With Docker Compose, the service looks like this:

```yaml
services:
  worker:
    image: <your-app-image>
    command: ["node", "worker.mjs"]
    restart: unless-stopped
    healthcheck:
      disable: true
    env_file: .env.worker
    networks:
      - supabase
```

## 3. Check it runs

The worker logs this line on start:

```
[worker] started: "marketing-due-campaigns" runs on "* * * * *" (Europe/Paris)
```

When a campaign is sent, it logs:

```
[worker] 1 campaign(s) processed: 120 sent, 0 failed
```

To see recent runs in the database:

```bash
docker exec -i $(docker ps -qf name=supabase-db) psql -U supabase_admin -d postgres -c \
  "SELECT state, count(*), max(created_on) AS last FROM pgboss.job WHERE name = 'marketing-due-campaigns' GROUP BY state;"
```

## Local development

1. Set `DATABASE_URL` in `.env` to any local Postgres, for example `postgres://postgres:postgres@localhost:5432/postgres`.
2. Run `npm run worker:dev`. It restarts on code changes.

To build the production bundle, run `npm run build:worker`. It writes `dist/worker.mjs`, and the Docker build copies that file to `worker.mjs`.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Configuration error: DATABASE_URL is not set` | Set `DATABASE_URL` on the worker container. |
| `password authentication failed for user "pgboss_worker"` | The password doesn't match. Run the setup script again and update `DATABASE_URL`. |
| `getaddrinfo ENOTFOUND supabase-db` | The worker isn't on the Supabase Docker network. Attach it, or set `DB_HOST` to a reachable host and run the script again. |
| `permission denied for database postgres` | The `GRANT` is missing. Run the setup script again. |
| Campaigns are not sent | Check the worker logs for the `started` line. Check that the campaign is not `DRAFT` or `PAUSED`, its dates include today, and its send time has passed in Paris time. |
| The setup script finds no container | Run `docker ps` and set `DB_CONTAINER_FILTER` to the database container's name. |
