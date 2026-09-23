# Project Memory

Last reviewed: 2026-09-19.

## Latest update: find and fix errors on the correct SKU (2026-09-19)

- Investigated the reported KURTA second-SKU errors in the actual browser. The local saved records were already repaired; the still-open editor retained earlier values. The idempotent repair script confirmed no additional data writes were needed. Error text had no navigation and the attributes tab defaulted to the first SKU, making the affected fields hard to locate.
- Every category gap now carries a stable variant ID and an actionable message. `Fix field` selects the correct editor tab, SKU and exact repeat slot, clears search, and focuses the control. Category correction view shows only the target and its matching entity/value or compliance type/ID pair; Show all restores the category. Blank dependent repeat slots are revealed without renumbering. The selected SKU persists across editor tabs; a sticky editing label keeps its identity visible. Common mapped fields route to their actual copy/product/variant controls.
- Search includes definition descriptions and choices so `HSN` finds External Product Information. Variants & pricing explains which Amazon field exports and links directly to it for each SKU; existing generic HSN values remain untouched. `Refresh saved data` reloads the workspace and pristine draft; discarding unsaved edits requires the normal UI confirmation. Mounting the attributes tab no longer clears the parent's loaded validation template.
- Verification: 18 frontend regression tests and six workbook export tests passed, plus TypeScript, authenticated local API integration and optimized production build. Browser reproduced exactly one missing and one invalid answer on DEMO-KURTA-02 while viewing SKU-01 with an unrelated search. Fix links selected SKU-02, cleared search, focused HSN and the second compliance repeat, and exposed the matching ID. Correcting temporary inputs restored zero gaps; Refresh saved data loaded the current stored listing. No test values were saved or approved. Final user tab shows SKU-02 External Product Information `610510` and `0 missing and 0 invalid` across both SKUs. No database schema, hosted data or deployment changes.

## Latest update: three reported Amazon example errors (2026-09-19)

- Fixed the Example-column scalar handling: PANTS Rise Height `5, 4` becomes the single demo number `5`; External Product Information `QUJ85, 610510, 61051010` becomes demo HSN `610510`. This demonstrates format, not a verified product classification. Incompatible compliance-type examples no longer leave the sample regulatory ID populated by itself; optional type and ID stay blank together. Original Example guidance and immutable template metadata remain unchanged.
- Shared UI/API/export validation now checks single numeric rise values, India HSN format and exact-slot external-information/compliance pairs. Incomplete pairs may be saved as drafts but block approval/export with field and SKU messages. Missing dependent controls become visible and show `Required for this SKU`. The Python row adapter has the same format/pair checks. XLSM writes Rise Height as a numeric cell; identifiers remain text to preserve leading zeros.
- `test/fix-workbook-example-values.ts --apply` repaired only the exact old examples on four known local dummy products/eight SKUs (18 cells), preserving later edits and prior revisions. Saved through the API, so affected approvals were revoked. Private pre-repair backup: `/tmp/listing-field-repair-1789810380547.json`. Refreshed the secret-free database snapshot and regenerated seed. No migration or hosted changes. Existing provenance counts still describe the original import; newly generated fixtures skip one additional orphan compliance example per category.
- Verification: 16 frontend tests, six XLSM/CSV export tests and seven Python tests passed, plus TypeScript, production build and authenticated local integration. Integration rejects bad numeric/HSN values and blocks orphan compliance IDs at approval. Browser verified `5`, `610510`, blank compliance, and immediate approval blocking when an unsaved test ID is entered; test input was cleared without saving. Amazon submission acceptance was not tested. Review/approve again and download a fresh file after these repairs.

## Latest update: original Amazon template downloads (2026-09-19)

- Replaced the generic browser review CSV with authenticated `POST /api/products/export`. Approve & download offers XLSM (default) and CSV. Catalog bulk export uses the same endpoint and groups by immutable template ID; different categories/versions stay in separate files inside one ZIP.
- The exporter reads current tenant-owned revisions, unrevoked approvals and immutable merchant snapshots in a repeatable-read transaction. Client input contains only product IDs, expected update timestamps and format. It rejects stale/unapproved records, mismatched source hashes/columns, unknown attributes and source workbooks containing existing listing data. No publish state or submission job is created.
- The actual source metadata specifies labelRow=4, attributeRow=5, dataRow=7. XLSM retains rows 1–6, including the gray SHIRT example row even in KURTA/PANTS/SHORTS, then fills one row per actual SKU from row 7. Exact reviewed core/JSONB mapping and repeat slots are retained; browse IDs become the workbook path-and-ID choice. Unanswered optional cells stay blank. Category-specific offer/size/weight/unit values come from reviewed Amazon attributes, not guesses from ambiguous generic metadata.
- ZIP/XML patching changes only Template data rows and used-range dimension. Every other ZIP part stays byte-identical, including all ten sheets' supporting parts and any VBA. Source column styles are applied to new literal-text cells. CSV keeps original header/example rows and exact columns, escapes quotes/newlines and preserves UTF-8. Formula-leading CSV values explicitly request XLSM instead of changing seller text.
- The admin importer now archives each original as `<sourceSha256>.xlsm` in private, gitignored `frontend/private/amazon-templates/` or `AMAZON_TEMPLATE_DIR`; even `--extract-only` creates that archive without DB writes. All four originals are archived locally. Next output tracing includes them in the export route; verified build trace lists all four. Deployment must provision the private source files or a durable source mount separately. Original source files were not modified or committed.
- Added fflate 0.8.2 and fast-xml-parser 5.5.7. Node owns export; no Python or artifact runtime is required in production. Native XLSM preservation is handled by targeted ZIP edits because the artifact API offers XLSX export only. Artifact import/render was used for source/output inspection, and independent read-only openpyxl/csv checks verified all four generated outputs (255/252/253/277 columns, 2 SKU rows, 10 sheets each). Excel itself and Amazon upload acceptance were not tested.
- Verification: 13 frontend regression tests, five export tests spanning all 1,037 source columns, TypeScript, optimized Next build and authenticated local integration passed. Integration covers XLSM/CSV, mixed-category ZIP, tenant/origin isolation, stale/revoked approval rejection and persistence. Browser verified format controls and both handlers on already-approved PANTS sample; API returned files and dialogs completed. The in-app download-event listener timed out, so native save-dialog/file-path behavior is not asserted. No sample facts or approvals were changed for browser QA.
- Next preview and PostgreSQL were restarted after the interrupted run. No production deployment or hosted database changes. Direct marketplace submission, full conditional/account validation, durable queued export assets and production operations remain separate work. These notes supersede older statements that all CSV downloads are generic review artifacts.

## Latest update: Data Definitions grouping and workbook example listings (2026-09-19)

- Corrected the earlier interpretation of counts: Data Definitions contains KURTA 186 (9 required), PANTS 197 (9), SHIRT 190 (9), SHORTS 217 (10). Exact export columns are 255/252/253/277. The user's PANTS 197 count was correct; the earlier 239 UI count was flattened remaining export cells, not unique definitions. The previous visibility-only fix is superseded.
- `templateDefinitions` groups exact normalized patterns, never just labels/root attributes. `TemplateDefinitionEditor` presents each definition once with separate repeat controls and exact-key values, preserving nested indexes and distinguishing image slots. Required completeness is counted per definition (at least one answer), not every available repeat slot. No executable Amazon min-count/conditional rules are claimed. Real products default to required/filled definitions; explicit workbook-example products show all. KURTA shows 178 category definitions plus eight common definitions, all with original Example-column guidance.
- Imported all 790 source examples and their Data Definitions row numbers. New `MarketplaceTemplate.sourceMetadata` is source-hash-bound, additive once and immutable thereafter. Migration `20260919020000_template_source_metadata` was tested and applied locally; existing schema hashes, category locks and historical payloads were preserved. The parser also reads actual Template validation flags: non-stopping dropdowns are suggestions, so numeric price input is allowed despite a Delete Offer dropdown. Closed enums remain validated consistently in UI, API, SQL and the Python adapter.
- At the user's explicit request, regenerated the four known local dummy listings/eight variants from workbook examples using `test/workbook-examples.py` and `test/build-template-seed.py`. `test/apply-workbook-examples.ts --apply` saved them through the authenticated API, appending eight revisions and preserving old history. It verifies local database and stable demo IDs/SKUs and will skip already-applied sources to preserve later edits. Do not rerun the ordinary seed/reset credentials for this. Existing category/browse/unique demo SKU values stay pinned. Generic workbook examples can describe unrelated products; each sample is clearly labeled. Incompatible enum examples remain as guidance (KURTA 12, PANTS 10, SHIRT 11, SHORTS 7). All raw examples are visible, but these are not coherent real products or marketplace-ready listings.
- Private backups before migration/refresh: `/tmp/sku-before-example-definitions.dump` and `/tmp/listing-examples-before-1789806782957.json`. The migration preserved then-current 16 products, 20 variants, 24 revisions and 12 payloads before the authorized demo refresh. Refreshed the secret-free `test/database-snapshot.json`; no hosted database/deployment was changed.
- Validation: 24 isolated SQL tests, 14 frontend contract/grouping/validation tests, six Python adapter tests (44 total), dataset validation, final authenticated API integration and optimized Next production build passed. API tests include repeated Cotton/Nylon cells, numeric price and strict invalid identifiers, stale edits and category locks. Browser verified 186=178+8 examples, repeat add/per-SKU reset, exact demo values, and desktop/390px layout without horizontal overflow. KURTA review is open at `http://localhost:3000/dashboard/skus/cc80a5a9-107e-4bc0-a6b5-3a84c8681a32/review`; local Next/PG remain running.

## Latest update: selected-category field display (2026-09-19)

- Investigated the user's concern about "239 category fields · PANTS". The API already returns one pinned template, without merging categories. Fresh read-only extraction of `PANTS.xlsm` matched its stored schema hash: 252 exact columns, of which 13 mapped common cells are edited elsewhere and 239 remain in the category section. Required/conditional/optional/repeated columns all contributed to the old headline count.
- Category fields now default to required plus entered answers on both edit and review pages. The headline counts visible fields and the Show all button names the selected category; search and the full view stay scoped to that template. Changing a template hides stale fields immediately, resets filters and verifies the returned template ID.
- Validation: 11 existing frontend tests and TypeScript passed. Browser checks confirmed PANTS defaults to nine required/entered fields for the sample SKU, expands to 239, and has no SHIRT size attributes even in full view/search. Restored the compact view without saving product data. No database or XLSM changes.

## Latest update: category contracts, XLSM field review and SKU form (2026-09-19)

- Reviewed the actual four private XLSM inputs again, without executing macros. KURTA/PANTS/SHIRT have 13 required exact cells each; SHORTS has 18. Across all four, 376 distinct exact columns and 13 shared required cells were classified in `test/amazon-templates/field-review.json`; `test/review-amazon-templates.py` reproduces the evidence. Common apparel fields are not assumed universal: fabric, identifier selections and other category/channel-specific values remain JSONB.
- Added typed `Product.brandName` and `ProductMarketplaceConfig`, one immutable category/browse-node/template assignment per product/channel/region shared by all variants. Database guards prevent switching/removing a saved category, cross-product bindings, reparenting SKUs, rewriting template/revision/payload contents, unknown/non-string JSONB cells, invalid dropdowns, duplicated mapped core facts and mismatched template provenance. Migrations `20260919000000_category_contract` and `20260919010000_variant_ownership` are now applied locally.
- Generation jobs gained tenant-scoped idempotency keys, a template reference and a base revision. Job inputs are immutable; stale generated outputs are rejected and one job may create only one output revision. No worker or real AI generation was connected. The Node/Prisma API remains the authoritative write boundary; the Python scaffold is not a second database implementation.
- New-product intake chooses and locks category first. Review exposes saved category fields, searchable exact answers, expandable workbook guidance and per-SKU country/HSN/weight. Requiredness comes from the selected template; fabric remains a dynamic required field. Repeated scalar columns remain separately editable, and the bullet editor derives its field count from the template. The review button stays blocked for missing required template answers. Ready catalog rows route to field review; active approval is displayed separately.
- Fixed per-variant logistics collapsing to the first SKU, core JSON overrides, first-variant-only approval display, and CSV exports dropping category answers. CSV intake now requires an Amazon category per batch, no longer invents India as origin, and caps synchronous imports at 50 products. Saves/approvals return only affected products; the client merges those into its cache. Initial workspace catalog loading is still eager, so server pagination/lazy details remain necessary for large catalogs.
- Local migrations preserved 16 products, 20 variants, 22 historical revisions and 10 payloads (including archived history), and backfilled four category configurations. Private local backups were made under `/tmp/` before migration. Hosted Supabase/Vercel were not changed. Do not rerun a demo seed to erase existing edits.
- Validation: 23 isolated PostgreSQL migration/constraint tests, 11 frontend contract/CSV tests, four Python row-adapter tests, TypeScript/production build and authenticated local integration passed. Integration checks include category-change/removal rejection, invalid attributes, differing origin/weight per SKU, stale edits, approval revocation and tenant/role checks. Browser review verified category-first selection/locking, editable saved fields, approval gating and 390px/mobile layout without horizontal overflow. Local PostgreSQL and Next preview are running at `127.0.0.1:5433` and `http://localhost:3000`.
- `frontend/CATALOG-DESIGN.md` records the review, source-of-truth storage map, relationships, rollout and limitations. Remaining production work includes initial catalog pagination, durable processing/outbox/leases, object-storage media, executable conditional marketplace validation, authorized official export/API submission and marketplace feedback. The CSV is still a review artifact. This change is a stronger database/form foundation, not a claim that the full SaaS backend is production-complete.

## Latest update: XLSM-backed demo catalog and dynamic Amazon form (2026-09-18)

- Replaced the visible local `sngram` catalog's twelve older generic fixtures with four clearly fictional apparel product families and eight variants generated by `test/build-template-seed.py` from the imported KURTA/PANTS/SHIRT/SHORTS field definitions and allowed choices. The twelve known old fixture IDs are soft-archived only; unrelated products and history are preserved. A blank XLSM is a category form, not source product records, so all names, SKUs, prices and copy are labeled samples rather than claimed seller facts.
- `test/seed-data.json` is the validated source; `test/seed-local.ts` creates one marketplace listing and immutable, template-pinned exact-key payload per variant. `test/database-snapshot.json` now exports only the four active products, eight variants/listings/revisions/payloads, excluding credentials, sessions and archived fixtures. `test/verify-template-seed.ts` verifies local database counts and pinned versions.
- Authenticated `GET /api/marketplace-templates` serves safe active category metadata. New Amazon products and the listing editor select product type and browse node, render searchable grouped fields from the stored version, allow per-variant answers, and persist exact XLSM column keys. The server rejects unknown keys/invalid dropdown choices and blocks local review approval when unconditional required answers are missing. The editor loads its pinned version on first open and shows readiness independent of tab selection; narrow layouts wrap editor tabs.
- Local TypeScript, production build, dataset validation, parser/row tests, 19 database-schema tests, authenticated API integration, template seed verification and browser catalog/editor review passed. PostgreSQL `127.0.0.1:5433` and the local Next app `http://localhost:3000` were restarted for this slice. Demo login remains `sngram` / `sngram` locally.
- This work has **not** migrated/imported the new catalog into hosted Supabase or changed Vercel data. Conditional Amazon requirements, real seller values, image/GTIN/offer rules, official upload-file generation, authorization and marketplace processing feedback remain open. Local review readiness is not Amazon approval.

## Latest update: versioned Amazon XLSM category catalog (2026-09-18)

- User supplied four Seller Central India `.xlsm` downloads in `/home/sangram/Downloads`: KURTA, PANTS, SHIRT and SHORTS. Private copies are in gitignored `test/amazon-templates/inbox/`; macro-free extracted definitions are in `test/amazon-templates/catalog/`. BOTTLE was not in this batch; `bottle.json` remains an unverified draft.
- `backend/modules/data_bridge/amazon_template.py` reads exact `Template` row-5 headers, `Data Definitions` requirement labels, `Dropdown Lists` choices, `Valid Values` product type and `Browse Data` nodes. It never runs VBA. Amazon's **example** product type says SHIRT in all four files, so the parser intentionally uses allowed Product Type instead of filename/example. Extracted column counts: KURTA 255, PANTS 252, SHIRT 253, SHORTS 277. Repeated columns keep exact keys and share a normalized semantic pattern.
- `frontend/prisma/schema.prisma` and migration `20260918000000_marketplace_templates` add immutable `MarketplaceTemplate` versions with a semantic SHA-256, one-active-per-scope index and JSONB fields/choices. Listings gain optional `productType`/`browseNodeId`; payloads can pin the exact template via `templateId`. Category-specific columns remain JSONB, so adding a product type does not require a migration or change existing SKU facts.
- `test/import-amazon-templates.ts` extracts inbox files and idempotently merges them into the selected PostgreSQL database, retaining old versions. `backend/modules/data_bridge/amazon_row.py` maps clear common facts plus exact-key seller answers to ordered candidate rows and reports missing required, invalid-choice and unresolved conditional fields. It is not an Amazon approval or upload implementation.
- Applied the fourth migration and imported all four categories into **local** `127.0.0.1:5433` PostgreSQL. A second import returned `unchanged` for each. All 19 isolated database tests, three catalog/row tests, Prisma validation, TypeScript checking and the Next.js production build passed. Local PostgreSQL was stopped after verification. The hosted Supabase database was not changed in this update; it will need the fourth migration and import separately before hosted runtime can use the catalog.
- Next implementation work: expose active template-driven fields and browse-node choice in the frontend, persist exact answers on reviewed payloads with template pinning, evaluate conditional rules with verified Amazon metadata, generate an official flat file or Listings/Feeds API payload and handle Amazon's real validation feedback. Do not claim approval from spreadsheet metadata alone. See `test/amazon-templates/README.md` and `TASK.md` MVP-10/MVP-24.

## Latest update: Vercel origin mismatch fix (2026-09-15)

- Hosted login returned `Request origin is not allowed.` The database was healthy; `requireOrigin()` required the browser `Origin` header to equal one static `APP_ORIGIN`, so Vercel production aliases, preview URLs and custom domains could be rejected.
- `frontend/lib/server/auth.ts` now normalizes and accepts the actual URL origin that served the request, the configured canonical origin, and—only when `VERCEL=1`—Vercel's public `x-forwarded-host`/`x-forwarded-proto`. Missing and unrelated origins remain rejected. Session cookie `Secure` now follows the verified request protocol rather than a possibly stale environment value.
- Added `frontend/tests/origin.ts` and `npm run test:origin`: direct, configured and Vercel alias origins passed; missing and foreign origins returned 403. The 22-route production build, all 9 prototype tests and the full authenticated local integration suite passed after a clean development-server restart.
- Vercel must redeploy this code change. `APP_ORIGIN` should still name the canonical production domain, but alias access no longer fails solely because it differs from that value. Vercel documents `host`/`x-forwarded-host` as the client-accessed custom or deployment domain and `x-forwarded-proto` as the public protocol.

## Latest update: local database migrated to Supabase (2026-09-15)

- User explicitly authorized the supplied Supabase project and provided its database password. The password was percent-encoded only in a mode-0600 temporary file under `/tmp`; it was not written to the repository, docs, snapshots or displayed in verification output.
- Verified the target session pooler and found an empty `public` schema. Applied all three committed Prisma migrations successfully, including pgvector, sessions and normalized usernames.
- Created a private, gitignored data-only local dump and restored it atomically to Supabase. Prisma migration history and browser sessions were excluded. Remote verification returned 1 user, 12 products, 12 variants, 12 marketplace listings, 12 listing revisions, 0 sessions, 3 successful migrations and the `vector` extension. User `sngram` has a password hash.
- Verified the application path through Prisma 7.10 + `@prisma/adapter-pg` + Supabase transaction pooling: `User.username=sngram` and 12 products were returned. The working runtime URL needs `pgbouncer=true&uselibpqcompat=true&sslmode=require`; the session/migration URL uses `sslmode=require`. Updated `.env.example`, `SUPABASE.md` and `VERCEL.md` accordingly without project credentials.
- The Supabase data migration is complete. The repository has no local Vercel project link or exact deployed origin, so Vercel still needs the completed transaction URL, pool size 1 and exact `APP_ORIGIN` configured in its private environment before hosted login can be verified.

## Latest update: validated dataset, username login and live local verification (2026-09-15)

- Added optional, unique, normalized `User.username` through `frontend/prisma/migrations/20260915000000_usernames/migration.sql`. Login now accepts a `Login ID` and still accepts an email identifier for existing accounts.
- The local demo account is now `sngram` / `sngram`; `test/seed-local.ts` hashes the password with scrypt and resets only this local credential on each deliberate seed. The UI/profile display name is Sangram. This weak credential is local-demo-only.
- Added `test/seed-contract.ts`, `test/validate-seed.ts` and `test/DATASET.md`. All 12 products and 12 variants are validated before seeding, and every frontend field has an explicit normalized Prisma destination or documented temporary JSON location.
- Applied all three migrations to `listing_agent_local`, merged the seed without overwriting existing product edits, and refreshed the credential-free `test/database-snapshot.json`. The snapshot contains username/profile plus 12 products, variants, listings and revisions, with no password/token/secret fields.
- Production build passed for 22 routes. Dataset validation, 9 prototype tests, 18 complete-migration/constraint tests and the authenticated local API integration suite passed. Direct login with `sngram` created a session and returned 12 PostgreSQL products; browser login visibly opened the populated catalog.
- Local PostgreSQL remains running at `127.0.0.1:5433` and Next development server at `http://localhost:3000`. The user-facing browser is left on `http://localhost:3000/dashboard/skus`.

## Latest update: Supabase pooled PostgreSQL configuration (2026-09-15)

- User supplied password-placeholder connection templates for a Supabase project: transaction pooler on 6543 and session pooler on 5432. No actual database password was supplied or stored, and no remote database was accessed.
- `frontend/prisma.config.ts` now prefers `DIRECT_URL` for Prisma CLI migrations and falls back to `DATABASE_URL` for local compatibility. The Next.js runtime continues using only `DATABASE_URL`.
- `frontend/lib/server/db.ts` now creates a small node-postgres client pool, defaulting to one connection per Vercel instance (`DATABASE_POOL_MAX`, bounded 1–10), with connection/idle timeouts. This matches a low-traffic serverless start and reduces pool exhaustion risk.
- Added `frontend/SUPABASE.md` with pgvector enablement, private environment setup, schema migration, data-only local dump/restore excluding migration history and sessions, expected record counts, Vercel variables and end-to-end verification. Vercel docs now identify Supabase as the selected path while preserving Render as an alternative.
- Updated `.env.example` with placeholder-only pooled/direct URLs and pool size. No secret or supplied project-specific URL was committed. `test/*.dump` remains ignored because a dataset dump includes the dummy user's password hash.
- Prisma validation, all 9 prototype tests, and a Node 22 production build covering all 22 routes passed. Build output was isolated from normal `.next`; no project server or local PostgreSQL service was started.

## Latest update: Render PostgreSQL deployment path (2026-09-15)

- Clarified the current deployed architecture: browser → Vercel Next.js pages/API routes → Render PostgreSQL. A separate Render/Python backend is not required for the implemented database-backed frontend slice.
- Added `frontend/RENDER-POSTGRES.md` covering creation of an empty Render PostgreSQL 16 database, Singapore-region suggestion for an India-first MVP, pgvector support, local `pg_dump`/Render `pg_restore`, verification, Vercel `DATABASE_URL`/`APP_ORIGIN`, preview isolation, pooling and safe operation order. Linked it from `frontend/VERCEL.md`.
- Added `test/*.dump` to `.gitignore` because a full dump contains account records and password hashes. `test/database-snapshot.json` remains inspection-only and cannot restore the normalized database.
- Render Free PostgreSQL is documented as temporary testing infrastructure: 1 GB, 30-day expiry, no managed backups and no managed pooling. The local dummy login is copied by a full database restore, but must not be treated as production authentication.
- No Render resource was created, no database dump was generated, no hosted database was mutated and no project servers were restarted. External Render credentials are still required before any hosted transfer.

## Latest update: Vercel clean-checkout build fix (2026-09-15)

- User's deployment log for commit `daec123` stopped at `next build`; it did not include the final error. Reproduced a real defect using an isolated archive of that exact commit: webpack build failed and TypeScript reported TS2307 for `@/generated/prisma/client`. The generated client is gitignored, but the previous build only ran `next build`.
- `frontend/package.json` now builds with `prisma generate && next build`. Node is pinned to `22.x` in the manifest/lockfile and `frontend/.nvmrc`. Docker uses the same build command without duplicate generation.
- Added `frontend/VERCEL.md` with root directory/build/runtime settings and hosted database instructions; linked it from frontend README. Added `APP_ORIGIN` to `.env.example`. Hosted login requires a network-accessible PostgreSQL database plus the correct HTTPS app origin. The laptop database and dummy account do not automatically transfer to Vercel. Local seed restrictions remain intact; builds do not run migrations or seeds.
- First verification passed all 22 routes in an isolated checkout using existing installed dependencies and no local env/generated files. A second verification uses Node 22.23.2 and a fresh `npm ci --ignore-scripts`; Prisma's explicit build-time generation succeeded. The second build also passed compilation, TypeScript checks and all 22 routes; evidence is recorded in VERCEL.md.
- No remote deployment, Git push or database changes were performed in this fix. Project servers previously stopped at the user's request were not restarted.

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
