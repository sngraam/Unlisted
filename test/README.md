# Local PostgreSQL workspace

The frontend uses Next.js server routes + Prisma + PostgreSQL. `seed-data.json` now supplies four fictional Amazon product families and eight variants modeled on the imported KURTA, PANTS, SHIRT and SHORTS XLSM template choices, plus profile/team/workspace/brand settings. See `DATASET.md` for the exact frontend-to-Prisma mapping. Existing `data.prisma` and `data.json` are preserved.

## Start and sign in

From the repository root:

```bash
bash test/postgres.sh start
cd frontend
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000/login. Use login ID `sngram` and password `sngram`. The same local-only details are in `test/local-login.txt` (gitignored and owner-readable). Rerunning the seed resets this demo credential but preserves existing product edits. This account belongs only to the local development database and must not be copied to a public deployment.

PostgreSQL 16.15 + pgvector 0.6.0 runs at `127.0.0.1:5433`, database `listing_agent_local`. The project owns its cluster; it is separate from any system PostgreSQL service. SCRAM authentication is enabled. Generated database credentials and persistent data are under ignored `.local/postgres/`. `frontend/.env.local` contains the private database URL and `APP_ORIGIN=http://localhost:3000`. Never prefix these with `NEXT_PUBLIC_`.

Stop/status commands: `bash test/postgres.sh stop` and `bash test/postgres.sh status`. Start PostgreSQL again after a computer restart. Do not delete `.local/postgres/data` unless you intentionally want to destroy this local database. It is not automatically recreated on app start.

## Install the local runtime on another Ubuntu 24.04 machine

The package binaries are not committed. These were downloaded from the configured official Ubuntu repositories, then unpacked without sudo:

```bash
mkdir -p .local/postgres/packages
cd .local/postgres/packages
apt-get download postgresql-16 postgresql-client-16 postgresql-16-pgvector libpq5
for package in *.deb; do dpkg-deb -x "$package" ../runtime; done
```

The runtime uses system libraries; if another machine is missing dependencies, install PostgreSQL/pgvector through its package manager or use an appropriate PostgreSQL container. Package versions follow that machine's configured repositories. [Official Ubuntu installation guidance](https://www.postgresql.org/download/linux/ubuntu/).

## Data and checks

- `DATASET.md`: field ownership and frontend-to-Prisma mapping.
- `seed-data.json`: editable seed input. Missing seed products are inserted; existing records are retained.
- `build-template-seed.py`: deterministically rebuilds the source data from the four normalized XLSM definitions; no macros or real seller facts are used.
- `seed-contract.ts` and `validate-seed.ts`: runtime validation for every dataset field; run `npm run test:dataset`.
- `seed-local.ts`: repeatable seed using stable IDs and one transaction. The local demo password is salted and hashed with scrypt.
- `database-snapshot.json`: exported normalized database records for inspection, excluding password hashes, sessions and credentials. This is a snapshot, not a restore-ready backup.
- `amazon-templates/README.md`: versioned template ingestion, dynamic category attributes and official-export limitations.
- `export-local.ts`: refresh that snapshot with `cd frontend && npm run db:export:local`.
- `frontend/tests/local-integration.ts`: run `npm run test:local` from `frontend` while the app/database are running. It creates separate temporary test tenants and cleans up only those records.

The app reads from PostgreSQL after sign-in. Create/import, product and variant edits, brand/profile settings and review approvals persist on the server. Each saved product edit creates new listing revisions and revokes earlier approval. Refreshing or signing in again reloads database values. Stale product edits return a conflict instead of overwriting newer saves. Email changes require a future verification flow, so that field is read-only.

The browser's old `listing-agent-demo-v1` data is no longer loaded or written. It has not been deleted. This seed migrates the bundled sample dataset, not unsaved edits or additional records that might exist in another browser's localStorage.

## Current scope

There is no anonymous demo-workspace shortcut. Protected pages and every workspace API require a valid server session and team membership. Sessions use opaque HttpOnly/SameSite cookies and are revoked on logout. Mutations require the configured same-origin request. The current workspace is the first active workspace available through the user's membership; a multi-workspace selector is still future work.

The four XLSM-backed fixtures have no invented publication jobs or seller connections. Legacy fixture products are archived but retained for history. Imported unconditional category requirements are displayed in the editor; local review checks and template completeness are not marketplace certification. AI buttons still insert sample copy. Approved downloads now fill the original Amazon Template tab as XLSM or CSV; `npm run test:export` verifies every source column and workbook preservation, and `npm run test:local` checks authorization and mixed-category ZIPs. Real OAuth, invitations, Google login, queue/LLM execution and marketplace publishing remain unimplemented.

## Verified on 2026-09-18

Local migration and four template imports succeeded. Dataset validation, 19 schema tests, three parser/row tests, authenticated API integration, four visible products/eight pinned variants, TypeScript and the production build passed. The saved template attributes round-trip through PostgreSQL. The current local URL is http://localhost:3000/login with `sngram` / `sngram` after starting PostgreSQL and Next.js; hosted Supabase/Vercel have not received this new migration or seed.

For this local iteration, uploaded raster images are bounded data URLs in product JSON. Object storage/media processing remains pending. Login throttling is process-local; production needs durable shared limits, account recovery/verification, secure HTTPS deployment and the remaining `TASK.md` acceptance criteria. No production rollout is implied by this local setup.

## Verified on 2026-09-13

Production build/TypeScript checks passed for 22 routes. Dataset validation, 9 prototype tests, 18 complete-migration tests, and the local authenticated API integration suite passed. Browser sign-in with `sngram` displayed the 12-record PostgreSQL catalog. Seed reruns preserve product edits while deliberately resetting the local demo credential. `git diff --check` passes.
