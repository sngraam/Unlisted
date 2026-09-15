# Deploying the frontend on Vercel

For the selected Vercel → Supabase PostgreSQL setup, see [SUPABASE.md](SUPABASE.md). The earlier Render alternative remains documented in [RENDER-POSTGRES.md](RENDER-POSTGRES.md).

## Project settings

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Root Directory   | `frontend`                       |
| Framework        | Next.js                          |
| Node.js          | `22.x`                           |
| Install Command  | Default, or `npm ci`             |
| Build Command    | `npm run build`                  |
| Output Directory | Next.js default; do not override |

`npm run build` now runs `prisma generate && next build`. The generated client is intentionally gitignored; every clean deployment must generate it before compiling the server modules. This is a local build step and does not connect to or migrate a database. It also avoids relying on an install lifecycle hook that may be skipped by package-manager policy. [Prisma's Vercel deployment documentation](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel).

Node is constrained to major version 22 so Vercel does not automatically select a future major version from the previous open-ended range. [Vercel Node.js settings](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Database and login after the build

Set these server-side environment variables for the deployment environment in Vercel:

- `DATABASE_URL`: the Supabase transaction-pooler URL on port 6543, ending in `?pgbouncer=true&uselibpqcompat=true&sslmode=require`. The database needs pgvector for the existing migration. The laptop's `127.0.0.1:5433` URL cannot connect Vercel to this project's local database.
- `APP_ORIGIN`: the exact app origin, such as `https://your-project.vercel.app`, without a trailing slash. The login and mutation routes require it to match the browser's Origin header. A preview/custom domain needs its matching configuration.

Do not set either variable with a `NEXT_PUBLIC_` prefix, and do not upload `.env.local` or `test/local-login.txt`. Redeploy after changing Vercel environment variables.

Apply `npm run db:migrate:deploy` from `frontend` through a trusted release environment explicitly configured with the intended hosted database URL. This repository's Prisma config also reads `.env.local`, so verify the selected database before running migrations. Migrations and seeding deliberately do not run inside the build command.

The local dummy user and 12 products exist only in the laptop's PostgreSQL database. A hosted database needs a separately authorized account/data setup. The `db:seed` script intentionally accepts only the named local database; it is not a production seed. A successful build alone does not transfer this dataset or enable hosted login.

## Troubleshooting the supplied build log

The supplied log ends at `next build`, before any failure message. Node/allow-scripts warnings alone do not establish the deployment error. This repository did have a clean-checkout build defect: its server imports a generated Prisma client, but the previous build command did not generate that client.

After pushing this change, redeploy with the settings above. If it still fails, capture the first error and final lines after `next build`. Do not broadly approve unrelated package install scripts to suppress warnings. Live marketplace publishing and the remaining production MVP requirements are still separate work.

## Verification — 2026-09-15

Reproduced the original missing-client failure in an isolated archive of commit `daec123`. With this patch, a fresh install (`npm ci --ignore-scripts`) followed by `npm run build` on Node 22.23.2 passed compilation, TypeScript checks and all 22 routes. The checkout contained no `.env.local`, pre-generated Prisma client or previous build output. Dependencies were installed from the lockfile; Prisma generation ran explicitly during the build. This is local build verification, not a completed Vercel deployment or hosted database test.
