# Project Memory

Last reviewed: 2026-09-13.

## Latest update: local PostgreSQL and authenticated catalog

- User requested local PostgreSQL, a dummy account, migration of sample data into the database, data files under `test/`, and removal of the demo-workspace option.
- PostgreSQL 16.15 + pgvector 0.6.0 extracted from Ubuntu packages into ignored `.local/postgres/runtime`; persistent cluster in `.local/postgres/data`, localhost only on port 5433. `test/postgres.sh` manages start/stop and creates private `frontend/.env.local`. No system sudo/password was needed. Database: `listing_agent_local`.
- Applied the initial migration and a new Session migration to this local database. Added Prisma PG adapter, scrypt password hashing, opaque hashed server sessions, membership/role checks and same-origin mutation checks. No anonymous dashboard/API access. Local login details are in ignored `test/local-login.txt`; do not copy database credentials or session tokens into docs.
- `test/seed-data.json` holds all 12 bundled sample products and profile/brand settings; `test/seed-local.ts` creates normalized user/team/membership/folder/workspace/brand/product/variant/listing/revision records with stable IDs. Reruns preserve edits/passwords. `test/database-snapshot.json` is a credential-free inspection export; `test/export-local.ts` refreshes it. Existing `test/data.prisma` and `test/data.json` preserved.
- WorkspaceProvider now caches API results instead of localStorage. Removed the demo-entry link and simulated sign-in/connection toggles. Create/import, facts/variant/content edits, profile/brand settings and review approvals persist through authenticated Next.js API routes. Saved edits append listing revisions and revoke approvals. Optimistic version checks reject stale product writes. Existing email is read-only pending verification. Current workspace is the first active membership workspace.
- Seed historical display statuses are labeled sample data in UI and stored only in fixture metadata; no fake live publication state or jobs. Saving a seed product clears the display override. AI generation and review CSV remain samples; OAuth, official marketplace validation, production auth lifecycle, invitations and publishing are not implemented. Old browser-local data is preserved but no longer consumed; only bundled sample data was seeded.
- Verification: local integration suite passed (unauthenticated access/redirects, wrong password, origin/role/tenant checks, price/SKU validation, stale-edit rejection, new revisions, approval revocation, persistence across fresh sessions, logout). Existing 9 prototype and 17 initial-migration tests passed. Browser sign-in showed all 12 seeded records and the populated editor. Seed rerun preserved records/password; snapshot checked for 12 products/variants/revisions with no credentials or live publication states. Final production build and TypeScript checks passed for all 22 routes after the approval-history cleanup.
- Read `test/README.md` for setup and limits. This establishes a local database-backed slice of TASK.md, not completion of the full MVP or its production security/auth acceptance criteria.

## Latest update: unauthenticated Amazon bottle schema attempt

- User asked to try without an account and save bottle fields in `bottle.json`. Made two unauthenticated, read-only India PTD calls: product-type search for `water bottle` and a candidate `BOTTLE` definition. Both returned HTTP 403 Unauthorized with “Access token is missing in the request header.” No credentials were used.
- Created root `bottle.json` with the actual response evidence, official source links, and 29 explicitly unverified internal frontend fields for a reusable drinking-water bottle. Official schema, confirmed product type, Amazon field paths, required status, constraints and enums remain unknown/null. This file is neither an Amazon JSON Schema nor a submission payload.
- Checked Amazon's public models/samples repository trees and public web results; no official bottle-specific schema was found within that search scope. This is not proof none exists elsewhere.
- Clarified `amazon_listing.md`: `sellerId` is optional for generic definitions, but authentication remains required. Seller-specific definitions need seller context. No backend integration, database migration or marketplace publication was performed; JSON parsing and draft/evidence consistency checks passed.

## Latest update: marketplace requirements research

- Created root `amazon_listing.md` and `filpcard_listing.md` (the latter spelling follows the user's request), with short Hinglish explanations and links to official docs checked on 2026-09-13.
- Amazon: discover actual product type, fetch seller/marketplace-specific PTD schema, build conditional forms, collect verified merchant values, validate/review, submit and track. Kurta/bottle fields are illustrative; no live seller-specific schemas were fetched.
- Flipkart: documented `POST /listings/v3` requires `product_id`; new catalog creation and a general category-metadata API were not verified in public Marketplace Seller docs. Obtain official category templates or a confirmed partner contract; do not confuse Commerce Cloud APIs with normal Seller API capabilities.
- This was documentation research only. No credentials, live API calls, schema changes or integration implementation were performed.

## Latest update: frontend typography and responsive refinement

The user requested local `paper-mono-variable.woff2`, `inter-variable.woff2` and `inter-variable-italic.woff2` fonts and a minimal, professional, responsive polish of the existing frontend.

- Saved the actual official font binaries and their licenses in `frontend/public/fonts/`; provenance and verified variable axes are recorded in that directory's README. `frontend/app/layout.tsx` uses `next/font/local` to expose Inter/Paper Mono variables. No runtime third-party font CDN is required.
- Refined the shared dark UI tokens, typography, panels, forms and interactions in `frontend/app/globals.css`; all routes inherit them. Sidebar promotion was replaced with a useful brand-guidelines shortcut. Demo labeling remains visible.
- Catalog metric shortcuts now filter products; reset, selected rows and mobile select-page controls are available. Phone layouts show labeled product rows instead of requiring a wide table. Small editor layouts retain product details and the audit.
- Added skip navigation, active-page semantics, a mobile drawer with focus/scroll management and an inert background, and keyboard-complete editor tabs with labeled panels. Profile choice now follows hydrated data until changed. Typing cancels pending sample generation to avoid a stale overwrite.
- Browser evidence is in `frontend/UI-REVIEW.md`: catalog/editor/dialog and keyboard interactions at 390px, editor at 1024px, login at 1440px, desktop catalog at 1320px, and 10 routes checked for overflow at 320px. These are prototype checks, not a completed MVP end-to-end/accessibility certification.
- Prisma, backend and external integrations are unchanged. `TASK.md` remains the implementation roadmap; do not mark MVP-32 complete from prototype QA alone.
- Final production build/TypeScript checks passed for all 16 routes; all 9 existing prototype tests passed during this refinement. Additional overview/catalog/editor overflow checks passed at 768/820/1280px. Development preview remains `http://localhost:3000/dashboard/skus` with temporary browser sizing reset.

## Latest update: MVP roadmap and frontend preview

The latest user request was to run the existing frontend and create a complete `TASK.md` for future models to build the MVP step by step. This task does not implement the remaining backend or deploy the product.

- Read `TASK.md` first for the current ordered backlog: 36 implementation tasks, dependencies, acceptance criteria, capability/input gates, release checklist and handoff instructions. Only already verified prototype/schema artifacts are checked off.
- The roadmap proposes Next.js server APIs + Prisma for identity/domain transactions, with internal FastAPI/ARQ/LangGraph workers using authenticated job contracts and a transactional outbox. This refines the original FastAPI-only API plan; ratify and document it in MVP-01 before implementing. It is not current runtime architecture.
- Delivery milestones distinguish a durable catalog, official export beta, connected publishing and complete MVP release. Amazon/Flipkart category templates, seller capabilities and A+ eligibility must be verified rather than inferred from the screenshots.
- Started the frontend on port 3000 and verified `GET /dashboard/skus` returned HTTP 200. Local preview: `http://localhost:3000/dashboard/skus`; sign-in design: `http://localhost:3000/login`. Verify the listener again in later sessions; the process is not guaranteed to persist.
- Existing build and test results below remain previous-run evidence. This documentation/server task did not repeat the full test suite or claim browser end-to-end verification.
- Next implementation task: MVP-01, then MVP-02 in `TASK.md`. Preserve the user's draft and unrelated working-tree changes.

## Latest update: Prisma schema implemented

The user explicitly selected “Start the Prisma schema” after asking to continue. This supersedes the earlier frontend-only focus for the current task.

- Canonical schema: `frontend/prisma/schema.prisma`; the pre-existing `test/data.prisma` changes are preserved as a reference draft.
- 21 models cover users/Google identities, multi-team memberships/roles, invitations, team folders, workspaces, one brand context per workspace, connections, products, variants, channel listings, revisions/payloads, generation/audit/approval/publish jobs, object storage metadata, galleries and bulk imports.
- Tenant-scoped composite foreign keys prevent cross-workspace associations. A variant supports Amazon and Flipkart listings independently; one listing per variant/platform/region is the present limit.
- Prices are exact Decimal(14,2) amounts with currency. SKU uniqueness is case-insensitive per workspace and survives soft deletion.
- Approvals reference an audit of the exact revision; publish jobs reference that approval/revision/platform/workspace and retain their own target connection. Runtime authorization, immutable-revision policies, passed-audit checks, and job transition rules still need service implementation.
- Initial migration: `frontend/prisma/migrations/20260913000000_initial_catalog/migration.sql`. It enables pgvector, creates the schema, adds PostgreSQL-only constraints/indexes, and is transactional.
- Prisma CLI/client pinned to 7.10.0. `frontend/prisma.config.ts` loads local env files but has no fallback datasource. `.env.example` has example-only credentials. Generated client is ignored at `frontend/generated/prisma/`.
- Added `db:*`, `test:db`, and `test:prototype` npm scripts. Installed PGlite + pgvector as dev-only dependencies for isolated database tests.
- Docker build uses Node 22, `npm ci`, and client generation; `.dockerignore` excludes local credentials and generated caches. Docker itself was not run in this environment.
- Prisma format/validate/client-generation succeeded. All 17 migration/constraint tests passed using an in-memory PostgreSQL engine, with no application database connection. The frontend production build also passed with the new dependencies.
- Prisma 7.10 native migrate-diff requires a datasource argument even for `--from-empty --to-schema`. Used a command-local dummy localhost:1 URL to generate SQL; this does not connect to a database and was not saved as a runtime default.
- Installation initially hit disk exhaustion. Removed only the prior generated `.next-build` and abandoned npm staging directories; user then explicitly freed 52 GB. Installation subsequently completed.
- The existing frontend is still a local demo and Python backend/worker scaffolds are unchanged. No migration was applied to an application database, and no authentication or CRUD API was implemented.
- Read `frontend/prisma/README.md` for the relationship diagram, field mapping, database-vs-service invariants, and setup. That guide now supersedes the earlier `frontend/SCHEMA-NOTES.md` design questions.

## Previous update: frontend prototype implemented

The user moved focus to building and running the frontend from five supplied dark-theme screenshots. They explicitly prefer **Prisma** for future database work, and want the frontend workflow to guide the schema. Keep the prior `test/data.prisma` user edits intact.

The previous scaffold-only review below is historical. Current frontend state:

- Implemented all existing page routes, plus Help and error/not-found recovery.
- Root `/` redirects to `/dashboard/skus`; `/login` and `/signup` show the invite-only design.
- Onboarding follows Profile → Workspace details → Brand context → Marketplace connections.
- Dashboard/catalog provide computed counts, local sample products, search, status/channel/date filters, selection, pagination, and CSV import/export.
- Product intake supports multiple variants, SKU uniqueness, pricing/stock, raw notes and optional local images.
- Listing workspace supports title, five bullets, description, keywords, deterministic sample generation, merchant facts, variant editing, live prototype review checks, explicit save, human approval and CSV export.
- Sign-in, invitation acceptance and connections are simulated; direct API publishing is disabled. No credentials are stored/transmitted. No backend, Prisma runtime, queue, actual AI or real marketplace integration was added.
- Data persists only in this browser via `listing-agent-demo-v1`. Seeded processing/published statuses are demo records, not live operations.
- CSV is a review export, not an official Amazon/Flipkart template. Rules are prototype checks rather than marketplace compliance certification.
- Shared CSS provides responsive dark styling matching the screenshot palette. Shared page/component files have purpose comments and were formatted with Prettier.
- Fixed root `.gitignore` from `lib/` to `/lib/` so frontend source utilities are tracked.
- `next.config.mjs` accepts `NEXT_DIST_DIR` for separate production build output while the development server remains alive.
- Production build and TypeScript check passed; nine focused parser/export/review tests passed. Browser interaction or visual QA was not performed.
- Started Next.js development server at `http://localhost:3000` and requested an in-app preview of `/dashboard/skus`. Verify the process is still running in later sessions rather than assuming it persists forever.
- The Figma prototype URL could not be opened by the available web tool; the five supplied screenshots were the visual reference.

Read `frontend/README.md` for routes, edit locations, commands, and limitations. Read `frontend/SCHEMA-NOTES.md` for proposed Prisma boundaries (memberships, workspace ownership, product/variants, channel-specific listings, revisions, approvals, publishing jobs) and unresolved product decisions. The actual Prisma draft is unchanged.

## Historical initial review


## Purpose and scope of this review

The user is building an AI-powered e-commerce catalog and listing management platform. It takes unstructured product information, generates brand-aware marketplace listings, validates them, supports human review, and exports or publishes the approved result.

The user's request for this task was to understand the README, file structure, complete system design, and supplied three-phase workflow; write this memory; then wait for the next command. This review does not authorize implementing the entire product.

Sources inspected: `README.md`, all nonempty application source/configuration files, the empty module scaffolds, `test/data.prisma`, and Git status/tracking. The supplied workflow describes intended behavior; it is not evidence that the behavior is implemented. No application build, service startup, database connection, or end-to-end test was performed during this documentation task.

## Initial implementation state (before frontend work)

This is an early scaffold, not a functioning end-to-end listing platform.

- `backend/main.py` implements four demo GET endpoints. All files under backend `core/`, `db/` (apart from the directory placeholder), `modules/`, `workers/`, and `storage/` are empty.
- `frontend/app/page.tsx` is a client component that requests backend health and sample SKUs on mount, but its rendered UI contains only `Hii`. The fetched state is not displayed.
- The root frontend layout and styles are implemented. Auth, onboarding, dashboard, SKU, review, and settings routes/layouts are empty files, as are the shared components, API wrappers, hooks, stores, and shared types.
- `test/data.prisma` is a detailed draft relational schema. It is not connected to the Python backend or a configured Prisma application. `test/data.json` is empty. This directory is not an implemented automated test suite.
- Docker configuration provides frontend and backend containers only. There is no configured PostgreSQL, Redis, ARQ worker, or object storage service.

## Intended user workflow

### Phase 1: Authentication and brand setup

1. Sign up or log in using an invite token or Google.
2. Connect a marketplace: Amazon SP-API or Flipkart.
3. Complete the user profile as an agency or individual.
4. Supply brand context: tone of voice, glossary, and banned words.
5. Save user/brand/integration context in PostgreSQL, with pgvector for brand-related vector retrieval.

The draft schema additionally contains `FREELANCE` as an account type. Preserve it unless the user requests otherwise. The exact login/invite semantics and navigation order are not implemented. The diagram places marketplace connection before brand setup, while integrations in the draft schema require a brand; the eventual onboarding implementation needs to reconcile those steps.

### Phase 2: SKU ingestion and AI generation

1. Add an individual SKU or upload a CSV for bulk onboarding.
2. Provide messy product text and/or images.
3. The Data Bridge parses inputs and extracts entities into canonical product JSON.
4. Queue work using Redis and ARQ.
5. A LangGraph workflow uses product facts and brand context to generate:
   - Catalog agent: title, bullet points, and product description.
   - Keyword agent: search terms and target keywords.
   - A+ content agent: content/media layout.
6. Run a rules engine for marketplace requirements and banned terms.
7. Feed failures back into generation for auto-correction; save validated output when checks pass.

The diagram fans out to three agents and joins at validation. Graph scheduling, concurrency, model providers, prompts, canonical fields, image handling, and retry limits remain unspecified in code. The correction loop needs an eventual terminal failure path rather than assuming unlimited retries.

### Phase 3: Tracking, review, and publishing

1. Show processing/readiness status in the dashboard.
2. Let the user review and edit the listing and grant human/workspace approval.
3. Choose a publishing route:
   - Flat-file CSV: generate marketplace-formatted data and download it.
   - Direct API: submit through the Amazon or Flipkart adapter and track the outcome.

Human approval is part of the intended product workflow before publishing. The actual transport for live status updates is undecided; no polling, SSE, or WebSocket implementation exists. Submission and confirmed marketplace publication also need distinct outcome handling; no adapter currently implements either.

## Architecture and directory responsibilities

The planned shape is a Next.js web client communicating with a modular FastAPI backend, plus background workers. PostgreSQL stores durable records, Redis backs the task queue, LangGraph orchestrates generation, and S3-compatible storage is suggested by the storage scaffold.

### Backend

| Path | Intended responsibility | Current state |
| --- | --- | --- |
| `backend/main.py` | Application entrypoint, middleware, route registration | Demo app and four endpoints only |
| `backend/core/` | Settings, authentication/security utilities, dependencies, errors | Empty files |
| `backend/db/base.py` | Database engine/session and ORM base | Empty |
| `backend/db/models/` | User, brand, SKU, listing, invite entities | Empty files |
| `backend/db/migrations/versions/` | Database migrations | `.gitkeep` only |
| `backend/modules/auth/` | Auth router, schemas, services, marketplace OAuth | Empty files; Amazon/Flipkart OAuth placeholders, no Google-specific implementation |
| `backend/modules/onboarding/` | Profile and brand setup APIs | Empty files |
| `backend/modules/data_bridge/` | SKU intake, CSV parsing, extraction, canonical schema | Empty files |
| `backend/modules/ai_engine/` | LangGraph graph/state, three agents, prompts, brand context | Empty files |
| `backend/modules/validation/` | Validation engine, schemas, banned terms, marketplace rules | Empty files |
| `backend/modules/listings/` | Listing retrieval, editing, and review APIs | Empty files |
| `backend/modules/execution/` | Publishing orchestration, CSV exporter, marketplace adapters | Empty files |
| `backend/workers/worker.py` | ARQ worker configuration | Empty |
| `backend/workers/tasks/process_sku_task.py` | Background processing of one SKU | Empty |
| `backend/workers/tasks/bulk_csv_task.py` | Bulk CSV task processing | Empty |
| `backend/storage/s3.py` | Object storage helper | Empty |

The repeated `router.py`, `service.py`, and `schemas.py` naming suggests HTTP handlers, business logic, and request/response contracts respectively; no such separation is wired into the app yet.

### Frontend

| Path | Intended responsibility | Current state |
| --- | --- | --- |
| `frontend/app/layout.tsx` | Root HTML layout and metadata | Implemented; title `AI Listing` |
| `frontend/app/page.tsx` | Root page | Fetches demo data, renders `Hii` |
| `frontend/app/globals.css` | Shared Tailwind/global styles | Implemented dark styling |
| `frontend/app/(auth)/` | `/signup` and `/login` | Empty pages |
| `frontend/app/onboarding/` | Profile, details, brand, connect steps and layout | Empty files |
| `frontend/app/dashboard/` | Dashboard and shared dashboard layout | Empty files |
| `frontend/app/dashboard/skus/` | SKU list, new SKU, `[id]` detail, `[id]/review` | Empty pages |
| `frontend/app/dashboard/settings/` | General and brand settings | Empty pages |
| `frontend/components/layout/` | Sidebar, topbar, onboarding progress | Empty files |
| `frontend/components/sku/` | SKU cards, status badges, CSV uploader | Empty files |
| `frontend/components/listing/` | Editor, validation feedback, publish selection | Empty files |
| `frontend/components/brand/` | Brand context form | Empty file |
| `frontend/components/ui/` | Reusable UI primitives | `.gitkeep` only |
| `frontend/lib/api/` | Auth/onboarding/SKU/listing/publish HTTP clients | Empty, locally present but ignored by Git |
| `frontend/lib/hooks/` | Current user, SKU status, listing editor behavior | Empty, locally present but ignored by Git |
| `frontend/lib/stores/` | Auth and onboarding client state | Empty, locally present but ignored by Git |
| `frontend/lib/utils.ts` | Shared utilities | Empty, locally present but ignored by Git |
| `frontend/types/` | Shared API, SKU, listing TypeScript contracts | Empty files |

### Declared technologies

- Frontend package ranges: Next.js `^14.2.0`, React/React DOM `^18.3.0`, TypeScript `^5.4.0`, Tailwind CSS `^3.4.1`, Zustand `^4.5.2`, Lucide icons, clsx, tailwind-merge.
- Backend: Python `>=3.10`, FastAPI, Uvicorn, Pydantic, and pydantic-settings.
- `backend/pyproject.toml` additionally declares SQLAlchemy, Alembic, asyncpg, pgvector, Redis, ARQ, LangGraph, LangChain, boto3, python-jose, passlib, and multipart support. These are planned capabilities, not implemented integrations.
- `backend/requirements.txt` only contains FastAPI, Uvicorn, Pydantic, pydantic-settings, and python-multipart. The Dockerfile installs this smaller dependency set.
- Next.js uses App Router, strict TypeScript, and the `@/*` alias. Actual config filenames are `next.config.mjs` and `tailwind.config.js`, differing from the README's illustrative `.ts` paths.

## Existing runtime behavior

| Endpoint | Implemented response |
| --- | --- |
| `GET /` | Welcome message, `/docs` link, static healthy status |
| `GET /health` | `status`, `service`, `version`, process uptime, hardcoded environment |
| `GET /api/v1/info` | Static app name, marketplace names, agent names, active status |
| `GET /api/v1/skus` | Three hardcoded sample SKUs |

There is no database-backed SKU operation, authentication requirement, or registered feature router. Health reports `docker-production` regardless of deployment and does not test dependencies. The information endpoint lists Shopify in addition to Amazon and Flipkart; Shopify is absent from the user's target workflow and draft marketplace enum, so do not assume it is in scope.

Sample SKU statuses are `Optimized`, `Draft`, and `Published`, which differ from the draft task enum. They are demo labels rather than a finalized lifecycle.

The root page reads `NEXT_PUBLIC_API_URL`, defaults to `http://localhost:8000`, requests `/health`, and then requests `/api/v1/skus` if health succeeds. It has no repeating timer or status subscription. Backend CORS currently allows every origin/method/header with credentials enabled; this is demo configuration, not a defined authenticated deployment policy.

## Draft data model: `test/data.prisma`

The schema declares PostgreSQL, pgvector and uuid-ossp extensions, a Prisma JavaScript client generator, UUID identifiers, and mapped SQL table/column names. It remains a design artifact; the Python ORM files are empty and neither package manifest establishes a Prisma workflow.

| Entity | Main fields and relationships |
| --- | --- |
| `User` | Unique email, full name, auth provider (default Google), account type, timestamps; owns brands and can approve publish jobs |
| `Brand` | Owner user, brand name, tone, banned words, glossary JSON, optional `vector(1536)` embedding; owns integrations and SKUs |
| `MarketplaceIntegration` | Brand, Amazon/Flipkart platform, seller ID, refresh/access token fields, token expiry, active flag |
| `ProductSku` | Brand, SKU code, raw text, image URLs, canonical JSON, current task status; has generation tasks and listings |
| `GenerationTask` | Product, queue ID, retry count, status, error log, start/completion timestamps |
| `GeneratedListing` | Product, title, bullets, description, search terms, target keywords, A+ layout, validation flag/score; has validation logs and publish jobs |
| `ValidationLog` | Listing, iteration, failed rules JSON, auto-fix flag, timestamp |
| `PublishJob` | Listing, CSV/direct API route, CSV URL or submission ID, status, response JSON, approval flag/approver, publication time |

Relations form this chain: `User -> Brand -> ProductSku -> GeneratedListing -> PublishJob`. Brands also have marketplace integrations, SKUs have generation tasks, listings have validation logs, and publish jobs optionally point back to an approving user. Parent relations generally cascade deletes; deleting an approver sets the approval reference to null.

Draft enums:

- `UserAccountType`: `INDIVIDUAL`, `AGENCY`, `FREELANCE`. The first two have lowercase database mappings; `FREELANCE` currently does not.
- `MarketplacePlatform`: `AMAZON`, `FLIPKART`.
- `TaskStatus`: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `REVIEW_PENDING`.
- `PublishingRoute`: `FLAT_FILE_CSV`, `DIRECT_API`.

Design details still to resolve when implementation is requested:

- SQLAlchemy/Alembic versus the draft Prisma schema as the authoritative database definition.
- Invite records/auth behavior: an empty `invite.py` exists, but the draft schema has no invite model.
- Agency/workspace membership and roles: the draft only models one owning user per brand.
- Target marketplace association: integrations have a platform, but listings and publish jobs do not directly identify their intended platform/integration.
- Canonical product fields and category-specific marketplace contracts; JSON fields alone do not define these.
- SKU uniqueness scope, listing revisions, approval invalidation after edits, retry limits, and publication lifecycle.
- Credential storage/refresh implementation, vector model/dimension choice, and retrieval behavior.

These are open implementation decisions, not additional approved scope or claims of implemented behavior.

## Local setup and known scaffolding issues

README run commands:

```bash
# From repository root
docker compose up -d --build

# Or backend in one terminal
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend in another terminal, starting from repository root
cd frontend
npm install
npm run dev
```

Expected URLs: frontend `http://localhost:3000`, API `http://localhost:8000`, Swagger `http://localhost:8000/docs`. The README also suggests `pip install -e .` as an alternative backend install.

- Compose builds `listing_backend` and `listing_frontend`, exposes 8000/3000, and uses `restart: always`. It has no persistence volumes, worker service, dependency health checks, or database/cache services.
- Backend Docker uses Python 3.10 slim and installs `requirements.txt`.
- Frontend Docker uses Node 18 Alpine, runs `npm install`, then `npm run build`, and serves with `npm start`.
- Public API URL is set to localhost before the frontend build. Remote deployment needs the correct browser-reachable URL at build time; the present configuration is oriented to local access.
- Empty Next.js page/layout modules lack required component exports and are likely build blockers. No build was run to confirm exact errors.
- `backend/pyproject.toml` references a backend-local `README.md` that is absent; editable packaging has not been verified.
- The root `.gitignore` rule `lib/` also ignores `frontend/lib/`. Its API wrappers/hooks/stores/utilities exist on disk but are not tracked. This was confirmed with `git check-ignore` and `git ls-files`; address it when requested to implement those files.
- No application test scripts/suite were found. Do not describe the scaffold as tested or production-ready.

## Continuation notes

- On arrival, `test/data.prisma` already had uncommitted user edits adding `FREELANCE` and changing a comment separator. Those edits were inspected and preserved.
- This task adds only `Memory.md`; no product code, dependency manifest, schema, or infrastructure was changed.
- Read this memory alongside current files on subsequent tasks. Keep intended design separate from implemented behavior, and update this document when the implementation changes.
- The next action is to wait for the user's next command.
