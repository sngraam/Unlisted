

> **2026-09-13 local database update:** Sign-in and workspace persistence now use local PostgreSQL + Prisma. See [test/README.md](test/README.md) for startup, seed data and account details. Earlier prototype-only sections below are historical where they conflict with this update.
# Project status and build roadmap

**2026-09-19:** Category-first SKU intake, locked product/category contracts, typed brand identity and per-SKU logistics are implemented. Dynamic category answers remain validated, versioned JSONB. See [the schema review and design](frontend/CATALOG-DESIGN.md) for XLSM evidence, migrations, scalability decisions and remaining production work.

The frontend has PostgreSQL-backed sign-in and catalog CRUD, while AI generation and marketplace publishing remain future work. The canonical Prisma schema includes a versioned Amazon category-template catalog populated locally from KURTA, PANTS, SHIRT and SHORTS XLSM files. The local demo catalog now has four fictional product families/eight variants with per-variant dynamic category fields; historical generic fixtures are archived. See [the template ingestion guide](test/amazon-templates/README.md) for adding another category without adding database columns.

Read [`TASK.md`](TASK.md) for the ordered MVP implementation tasks, dependencies and release acceptance criteria. Read [`Memory.md`](Memory.md) for the current handoff and historical decisions, [`frontend/README.md`](frontend/README.md) for the UI edit guide, and [`frontend/prisma/README.md`](frontend/prisma/README.md) for the database design. The directory tree below includes intended scaffolds, not only finished features.

# Run

For simple explanations of category-specific requirements and listing APIs, read [`amazon_listing.md`](amazon_listing.md) and [`filpcard_listing.md`](filpcard_listing.md). They distinguish verified API behavior from examples and integration work still needed.

## Running Frontend and Backend

### Option 1: Docker Compose (Recommended)
> **Note**: Docker handles package installation (`npm install` & `pip install`) automatically inside containers!
```bash
docker compose up -d --build
```

### Option 2: Native Commands (First-Time Setup)

#### 1. Backend (FastAPI - Port 8000)
```bash
cd backend
pip install -r requirements.txt or pip install -e .
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend (Next.js - Port 3000)
```bash
cd frontend
npm install
npm run dev
```

### Create Env Files
```bash
/backend/.env
/frontend/.env.local
```

### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs


---

# Folder Stucture

## Backend 
```
backend/
├── main.py
├── pyproject.toml
├── requirements.txt
├── .env
├── core/
│   ├── config.py
│   ├── security.py
│   ├── dependencies.py
│   └── exceptions.py
├── db/
│   ├── base.py
│   ├── models/
│   │   ├── user.py
│   │   ├── brand.py
│   │   ├── sku.py
│   │   ├── listing.py
│   │   └── invite.py
│   └── migrations/
│       └── versions/
│           └── .gitkeep
├── modules/
│   ├── auth/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── oauth/
│   │       ├── amazon.py
│   │       └── flipkart.py
│   ├── onboarding/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── schemas.py
│   ├── data_bridge/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── parser.py
│   │   ├── extractor.py
│   │   ├── canonical_schema.py
│   │   └── schemas.py
│   ├── ai_engine/
│   │   ├── graph.py
│   │   ├── state.py
│   │   ├── agents/
│   │   │   ├── catalog_agent.py
│   │   │   ├── keyword_agent.py
│   │   │   └── aplus_agent.py
│   │   ├── prompts/
│   │   │   ├── catalog.py
│   │   │   ├── keyword.py
│   │   │   └── aplus.py
│   │   ├── brand_context.py
│   │   └── schemas.py
│   ├── validation/
│   │   ├── engine.py
│   │   ├── rules/
│   │   │   ├── amazon_rules.py
│   │   │   └── flipkart_rules.py
│   │   ├── schemas.py
│   │   └── banned_terms.py
│   ├── listings/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── schemas.py
│   └── execution/
│       ├── router.py
│       ├── service.py
│       ├── csv_exporter.py
│       ├── marketplace/
│       │   ├── amazon_adapter.py
│       │   └── flipkart_adapter.py
│       └── schemas.py
├── workers/
│   ├── worker.py
│   └── tasks/
│       ├── process_sku_task.py
│       └── bulk_csv_task.py
└── storage/
    └── s3.py
```

## frontend 

```
frontend/
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── .env.local
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── signup/page.tsx
│   │   └── login/page.tsx
│   ├── onboarding/
│   │   ├── layout.tsx
│   │   ├── profile/page.tsx
│   │   ├── details/page.tsx
│   │   ├── brand/page.tsx
│   │   └── connect/page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── skus/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── review/page.tsx
│       └── settings/
│           ├── page.tsx
│           └── brand/page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── StepProgress.tsx
│   ├── sku/
│   │   ├── SkuCard.tsx
│   │   ├── SkuStatusBadge.tsx
│   │   └── CsvUploader.tsx
│   ├── listing/
│   │   ├── ListingEditor.tsx
│   │   ├── ValidationErrors.tsx
│   │   └── PublishSelector.tsx
│   └── brand/
│       └── BrandContextForm.tsx
├── lib/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── onboarding.ts
│   │   ├── skus.ts
│   │   ├── listings.ts
│   │   └── publish.ts
│   ├── hooks/
│   │   ├── useCurrentUser.ts
│   │   ├── useSkuStatus.ts
│   │   └── useListingEditor.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── onboardingStore.ts
│   └── utils.ts
└── types/
    ├── api.ts
    ├── listing.ts
    └── sku.ts
```


---

# Prisma Database Schema

The canonical PostgreSQL schema now lives in [`frontend/prisma/schema.prisma`](frontend/prisma/schema.prisma). It models teams/workspaces, brand context, products and variants, marketplace-specific listing revisions, validation, approval, publishing, and media/import jobs.

Read [`frontend/prisma/README.md`](frontend/prisma/README.md) for the relationship diagram, frontend field mapping, constraints, and integration steps. `test/data.prisma` is retained as the original draft.

```bash
cd frontend
npm run db:validate
npm run db:generate
```

These commands need no running database. Configure a PostgreSQL database with pgvector and a server-only `DATABASE_URL` before applying migrations. The frontend remains a local demo until its API integration is implemented.
