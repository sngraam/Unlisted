
# Run

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

