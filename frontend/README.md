# AI Listing Agent — frontend

For Vercel builds, runtime environment variables and hosted database setup, see [VERCEL.md](VERCEL.md).

> **2026-09-13 local database update:** Sign-in and workspace persistence now use local PostgreSQL + Prisma. See [local database guide](../test/README.md) for startup, seed data and account details. Earlier prototype-only sections below are historical where they conflict with this update.

A Next.js 14 frontend prototype based on the supplied dark dashboard, login, connection, listing editor, and publish-dialog references. The existing FastAPI backend is not required for this preview.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login` and use the local account documented in `../test/README.md`. After sign-in, the app opens `/dashboard/skus`.

```bash
npm run build
npm start
```

To verify a production build while the development server keeps running, use `NEXT_DIST_DIR=.next-build npm run build`. This avoids writing both processes into `.next`.

## Route map

| Route                         | Purpose                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| `/login`, `/signup`           | PostgreSQL-backed sign-in; invitation acceptance is pending      |
| `/onboarding/profile`         | Individual, Agency, or Freelance profile                         |
| `/onboarding/details`         | Person, team, and workspace details                              |
| `/onboarding/brand`           | Brand voice, glossary, banned terms, customer needs              |
| `/onboarding/connect`         | Simulated marketplace connections                                |
| `/dashboard`                  | Counts and review queue derived from the local catalog           |
| `/dashboard/skus`             | Search, filter, select, paginate, import, and export products    |
| `/dashboard/skus/new`         | Create a parent product with merchant variants                   |
| `/dashboard/skus/[id]`        | Listing editor, variants/pricing, product details, review checks |
| `/dashboard/skus/[id]/review` | Direct entry into the final review workspace                     |
| `/dashboard/settings`         | Workspace details and demo connections                           |
| `/dashboard/settings/brand`   | Shared brand-context settings                                    |
| `/dashboard/help`             | Workflow guide and prototype limitations                         |

## Where to edit

- `app/globals.css`: shared colors, typography, responsive layouts, component styling.
- `app/**/page.tsx`: route composition and page content. Every page starts with a purpose comment.
- `components/layout/`: sidebar, header, settings navigation, onboarding progress.
- `components/sku/Catalog.tsx`: catalog state and presentation.
- `components/sku/CsvUploader.tsx`: import selection, validation, and preview.
- `components/listing/ListingEditor.tsx`: editable listing copy, draft save, sample generation, and review.
- `components/listing/VariantEditor.tsx`: SKU options, prices, inventory.
- `components/listing/PublishSelector.tsx`: human approval and review CSV export.
- `components/brand/BrandContextForm.tsx`: shared brand input contract.
- `components/ui/`: shared logo, marketplace badges, and keyboard-accessible modal.
- `lib/stores/workspaceStore.tsx`: authenticated API cache and persisted workspace mutations.
- `../test/seed-data.json`: the twelve validated sample catalog records.
- `lib/csv.ts`: CSV parser, formula-safe cells, variant-row export.
- `lib/validation.ts`: prototype review rules, deliberately separate from UI.
- `types/sku.ts`: product, variant, marketplace, and status contracts.

Unused pre-existing scaffold files remain explicitly marked as reserved for future backend integration. `frontend/lib/` is now trackable; the root Python ignore pattern previously hid it.

## What works

Search SKU/name/brand; status, channel, and date filters; multi-selection; pagination; CSV import preview with required-column, duplicate-SKU, price, stock, size, and row-limit checks; review CSV export; new products and variants; optional local image uploads; title/bullet/description/keyword editing; sample generation; local rule checks; approval gating; profile/brand edits; connection-state previews; mobile navigation; error/empty states.

The local MVP stores workspace and catalog data in PostgreSQL. Browser state is only a cache of authenticated API responses; it does not store passwords or session tokens. Seeded status labels are presentation fixtures and do not claim live marketplace publication.

## Interface and typography

The UI uses locally hosted Inter Variable (normal and italic) and Paper Mono Variable. Files and original licenses are in `public/fonts/`; exact upstream revisions and usage notes are in [`public/fonts/README.md`](public/fonts/README.md). `app/layout.tsx` loads them through `next/font/local`, with `display: swap` and fallback families; runtime font loading does not require a third-party CDN.

Edit `app/globals.css` for the shared charcoal palette, typography tokens, surfaces, spacing, focus/hover states and responsive breakpoints. Inter handles reading and forms; Paper Mono handles identifiers, section labels and numeric details. All existing auth, onboarding, dashboard, catalog, editor, settings, help and error pages share this system.

At phone widths (768px and below), catalog rows become labeled product cards and navigation becomes a keyboard-accessible drawer. Catalog metric cards filter the listing, active filters can be reset, and the editor supports arrow/Home/End keyboard tab navigation. Product context and the validation audit remain available on smaller screens. Motion respects reduced-motion preferences.

Browser verification and remaining limits are recorded in [`UI-REVIEW.md`](UI-REVIEW.md).

## Demo integration boundaries

Password authentication, server sessions and PostgreSQL catalog persistence work locally. Invitation verification, OAuth, AI inference, background processing and marketplace publishing remain pending. Seeded Processing/Published statuses are sample records. Connections are labeled as simulated. Direct API publishing is disabled. Sample generation is deterministic text, and its claims still need human verification.

Export produces a **review CSV**, not an official Amazon/Flipkart category upload file. Prototype review checks are not marketplace certification. Uploaded images are small data URLs in browser storage; production uploads must use object storage. Approval is invalidated when content is edited and saved. Refreshing with unsaved editor changes prompts before discarding them.

The production schema and backend should follow the approved workflow, rather than copying browser storage one-to-one. See `SCHEMA-NOTES.md` for the proposed Prisma boundaries.

## Focused checks

```bash
node tests/prototype.test.cjs
```

Nine checks cover quoted CSV fields, BOM/blank lines, malformed CSV rejection, formula-safe export, validation failures, and one export row per variant. Production build checks all page modules and TypeScript contracts. No browser interaction or visual regression testing was performed.

## Prisma schema

For the full product implementation order and acceptance criteria, read [`../TASK.md`](../TASK.md). The next step is to ratify the Prisma/API/worker architecture and provision the local service stack.

The canonical database model is now in `prisma/schema.prisma`, with the initial SQL migration and a detailed relationship/field guide in `prisma/README.md`. The original `test/data.prisma` remains a reference draft. The current frontend is still a browser-local prototype; no database-backed API routes have been added.

```bash
npm run db:validate
npm run db:generate
npm run test:db
```

The database tests use an isolated in-memory PostgreSQL engine. To apply migrations to a real database later, follow `prisma/README.md` and configure the server-only `DATABASE_URL` from `.env.example`.
