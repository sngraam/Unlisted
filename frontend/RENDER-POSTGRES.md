# Hosting this project's PostgreSQL database on Render

The deployed architecture is:

```text
Browser → Vercel Next.js app (pages + API routes) → Render PostgreSQL
```

You do not need to deploy the Python scaffold or a separate Render web service for the current app. The authenticated routes under `frontend/app/api/` are the backend used by the browser. Render hosts only PostgreSQL.

## 1. Create an empty Render database

Open [Render's New Postgres page](https://dashboard.render.com/new/database) and use:

| Field | Suggested value |
| --- | --- |
| Name | `unlisted-db` |
| Database | `unlisted` |
| User | Let Render generate it |
| Region | Singapore for an India-first MVP |
| PostgreSQL version | 16, matching the local database |
| Plan | Free only for a temporary test; paid for persistent MVP data |

Wait until the database status is **Available**. On its **Info / Connect** page, copy the **External Database URL**. Vercel is outside Render's private network, so Render's Internal Database URL will not work from Vercel. External connections use TLS; keep `sslmode=require` in the URL. [Render connection guide](https://render.com/docs/postgresql-creating-connecting).

The existing migration enables `vector`, and Render supports pgvector on PostgreSQL 13+. [Render extension list](https://render.com/docs/postgresql-extensions).

Free Render Postgres is suitable only for this testing stage: it is limited to 1 GB, expires after 30 days, has no managed backups, and has no managed connection pooling. Render provides a 14-day upgrade grace period after expiry, then deletes the database. [Render free database limits](https://render.com/docs/free).

## 2. Copy the current local schema and dataset

The current data is normalized across users, teams, workspaces, products, variants, listings, revisions and sessions. `test/database-snapshot.json` is for inspection and is not a restorable database backup. Use PostgreSQL's dump/restore tools.

Start the local database and create a custom-format backup from the repository root:

```bash
bash test/postgres.sh start

PG_BIN="$PWD/.local/postgres/runtime/usr/lib/postgresql/16/bin"
export PGPASSWORD="$(cat .local/postgres/password)"
"$PG_BIN/pg_dump" \
  --host=127.0.0.1 \
  --port=5433 \
  --username=listing_local \
  --dbname=listing_agent_local \
  --format=custom \
  --file=test/listing-agent-local.dump
unset PGPASSWORD
```

The dump can contain user records and password hashes. It is gitignored by the repository rule added below; do not upload it to GitHub or send it through chat.

Restore it only into the newly created, empty Render database. Paste the Render External Database URL at the hidden prompt:

```bash
PG_BIN="$PWD/.local/postgres/runtime/usr/lib/postgresql/16/bin"
read -rsp "Render External Database URL: " RENDER_DATABASE_URL
echo
"$PG_BIN/pg_restore" \
  --dbname="${RENDER_DATABASE_URL}?sslmode=require" \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  test/listing-agent-local.dump
unset RENDER_DATABASE_URL
```

If the copied URL already contains a `?`, append `&sslmode=require` instead. Render often supplies the URL with TLS configuration already included; do not add a duplicate parameter.

Do not run `npm run db:migrate:deploy` before this full restore, because the dump already contains the schema and Prisma migration history. Restoring into a database that already has application tables can produce duplicate-object errors. Render also recommends restoring backups into an empty database. [Render backup and restore guide](https://render.com/docs/postgresql-backups).

After restoration, verify without printing credentials:

```bash
read -rsp "Render External Database URL: " RENDER_DATABASE_URL
echo
"$PG_BIN/psql" "${RENDER_DATABASE_URL}?sslmode=require" \
  -c 'SELECT count(*) AS products FROM products;' \
  -c 'SELECT count(*) AS users FROM users;' \
  -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
unset RENDER_DATABASE_URL
```

Expected seed counts before additional edits: 12 products and 1 user. The local dummy login is copied as part of the database. Change the seeded password/account model before treating the deployment as a public production app.

## 3. Connect Vercel to Render

In Vercel, open **Project → Settings → Environment Variables** and add:

| Variable | Value | Environment |
| --- | --- | --- |
| `DATABASE_URL` | Render **External Database URL**, with `sslmode=require` | Production |
| `APP_ORIGIN` | Exact deployed origin, such as `https://unlisted.vercel.app` | Production |

These are server secrets. Do not prefix either name with `NEXT_PUBLIC_`. After adding or changing variables, redeploy; Vercel environment-variable changes do not affect older deployments. [Vercel environment variables](https://vercel.com/docs/environment-variables).

For the first deployment, configure Production only. Preview deployments have different origins. A fixed production `APP_ORIGIN` correctly rejects mutations from preview domains; preview database/origin support should use a separate preview database and matching origin policy rather than sharing production casually.

Use the existing Vercel settings from `VERCEL.md`: root directory `frontend`, Node 22.x, and build command `npm run build`. The build generates Prisma Client but deliberately does not migrate or seed a database.

## 4. What happens afterward

- Opening the Vercel URL runs the Next.js UI.
- Login posts to the Next.js API route running on Vercel.
- That server route reads/writes Render Postgres through `DATABASE_URL`.
- The browser never receives the Render database password.
- Prisma Studio is a local admin tool; do not expose it as a public deployment.
- Amazon/Flipkart OAuth and publishing remain separate future integrations.

Because Vercel uses serverless instances and Render Free has no managed pooler, keep this deployment for low-traffic MVP testing. For sustained traffic, use a paid Render database with its connection-pooling URL, or a PostgreSQL provider designed for serverless workloads. Render's managed PgBouncer URLs use port 6432 when pooling is enabled. [Render connection pooling](https://render.com/docs/postgresql-connection-pooling).

## Safe order of operations

1. Push and successfully build the current Vercel fix.
2. Create an empty Render PostgreSQL 16 database.
3. Dump local PostgreSQL and restore into Render once.
4. Add Render's external URL and the production origin to Vercel.
5. Redeploy Vercel and test login, catalog read, one edit, logout and a fresh login.
6. Take a manual `pg_dump` backup if using the free plan.

Creating the Render database and restoring data are external writes. Do those only after checking the target database name and confirming it is the intended empty MVP database.
