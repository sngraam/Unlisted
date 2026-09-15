# Supabase PostgreSQL setup for this project

The connection templates supplied for this project have the correct roles:

```text
Vercel runtime → DATABASE_URL → transaction pooler, port 6543
Prisma migrate → DIRECT_URL   → session pooler, port 5432
```

`[YOUR-PASSWORD]` is still a placeholder. Use the database password created with the Supabase project. If it contains reserved URL characters such as `@`, `:`, `/`, `#`, `%` or `?`, URL-encode it before inserting it into a connection URL. Never commit either completed URL or paste it into chat.

The application continues to use Prisma. Supabase hosts PostgreSQL and provides the serverless pooler; Supabase Auth and its browser database SDK are not required for this implementation.

## 1. Enable pgvector

In Supabase Dashboard, open **Database → Extensions**, search for `vector`, and enable it. The canonical Prisma migration also requests the extension, but enabling it visibly before migration confirms that the project supports the required `vector(1536)` column. [Supabase pgvector guide](https://supabase.com/docs/guides/ai/vector-columns).

## 2. Keep the URLs private

For local migration work, create ignored `frontend/.env.local` entries:

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@REGION.pooler.supabase.com:5432/postgres?sslmode=require"
DATABASE_POOL_MAX="1"
APP_ORIGIN="http://localhost:3000"
```

The repository ignores `.env.local`. Do not replace the placeholders in `.env.example`.

The Prisma CLI now prefers `DIRECT_URL`; the running Next.js app reads `DATABASE_URL`. This matches Supabase's guidance to use session mode for Prisma migrations and transaction mode for serverless traffic. `sslmode=require` forces encryption. `uselibpqcompat=true` gives the current node-postgres parser standard libpq semantics for `sslmode=require`; without it, the installed parser treats `require` as certificate verification and rejects Supabase's pooler certificate chain. [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).

## 3. Create the hosted schema

From `frontend`, first verify which host is configured without printing the password:

```bash
node -e 'const u=new URL(process.env.DIRECT_URL); console.log({host:u.host,database:u.pathname})'
```

After confirming that it is the intended Supabase project, apply the committed migrations:

```bash
npm run db:generate
npm run db:migrate:deploy
```

This creates the application tables and Prisma migration history. It does not seed or overwrite product data. Do not run `prisma db push`; committed migrations are the source of truth.

## 4. Copy the local demo dataset

The safest path for this existing database is:

1. Apply Prisma migrations to the fresh Supabase project.
2. Create a **data-only** dump from local PostgreSQL.
3. Exclude `_prisma_migrations` because Supabase already has its own applied migration records.
4. Exclude `sessions`; users should sign in again on the deployed app.
5. Restore the data-only dump through the Supabase session pooler.

From the repository root, with local PostgreSQL started:

```bash
bash test/postgres.sh start
PG_BIN="$PWD/.local/postgres/runtime/usr/lib/postgresql/16/bin"
export PGPASSWORD="$(cat .local/postgres/password)"
"$PG_BIN/pg_dump" \
  --host=127.0.0.1 \
  --port=5433 \
  --username=listing_local \
  --dbname=listing_agent_local \
  --schema=public \
  --data-only \
  --exclude-table=_prisma_migrations \
  --exclude-table=sessions \
  --format=custom \
  --file=test/listing-agent-data.dump
unset PGPASSWORD
```

Then load `DIRECT_URL` privately and restore into the already-migrated, otherwise empty application schema:

```bash
PG_BIN="$PWD/.local/postgres/runtime/usr/lib/postgresql/16/bin"
"$PG_BIN/pg_restore" \
  --dbname="$DIRECT_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  test/listing-agent-data.dump
```

The dump includes the dummy user's password hash and must remain private. `test/*.dump` is gitignored. This is a one-time import into a fresh application schema; rerunning it causes primary-key/SKU conflicts.

Verify counts through the session pooler:

```bash
"$PG_BIN/psql" "$DIRECT_URL" \
  -c 'SELECT count(*) AS users FROM users;' \
  -c 'SELECT count(*) AS products FROM products;' \
  -c 'SELECT count(*) AS variants FROM product_variants;'
```

Expected initial values are 1 user, 12 products and 12 variants.

## 5. Configure Vercel

In **Vercel Project → Settings → Environment Variables**, configure Production:

| Variable            | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`      | Completed encrypted transaction-pooler URL on port 6543     |
| `DATABASE_POOL_MAX` | `1`                                                         |
| `APP_ORIGIN`        | Exact production URL, with `https://` and no trailing slash |

`DIRECT_URL` is not required by the running app or normal Vercel build because migrations do not run during deployment. Keep it in the trusted migration environment. If you intentionally run migrations from CI later, store it there as a protected secret.

Redeploy after adding variables. Vercel does not apply changed environment variables to previous deployments.

## 6. Verify deployed behavior

Test in this order:

1. Open `/login` and sign in with the migrated dummy account.
2. Confirm 12 catalog products load.
3. Edit one listing and save it.
4. Refresh and confirm the edit persists.
5. Sign out, sign in again, and confirm the same value.

The app's Next.js API routes remain the security boundary. Do not place a Supabase database URL in browser code or expose it using a `NEXT_PUBLIC_` variable. The current application tables do not rely on Supabase Data API/RLS because browsers never query them directly.

Supabase Free projects pause after inactivity and do not include automatic backups. Before meaningful data is added, define a backup and account-recovery process. [Supabase pricing and free limits](https://supabase.com/pricing).
