-- First-run onboarding and product intake are persisted separately from
-- generated listing revisions. This migration is intentionally additive.
CREATE TYPE "AcquisitionSource" AS ENUM ('GOOGLE', 'COLD_CALL', 'FACEBOOK', 'COLD_EMAIL', 'INSTAGRAM', 'OTHER');
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "brand_contexts"
  ADD COLUMN "revenue_range" VARCHAR(80),
  ADD COLUMN "competitors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "target_age_min" INTEGER,
  ADD COLUMN "target_age_max" INTEGER,
  ADD COLUMN "target_countries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "workspace_onboardings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "current_step" INTEGER NOT NULL DEFAULT 1,
  "is_owner" BOOLEAN NOT NULL DEFAULT false,
  "acquisition_source" "AcquisitionSource",
  "acquisition_other" VARCHAR(255),
  "requested_marketplaces" "Marketplace"[] DEFAULT ARRAY[]::"Marketplace"[],
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_onboardings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspace_onboardings_workspace_id_key" UNIQUE ("workspace_id"),
  CONSTRAINT "workspace_onboardings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workspace_onboardings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "workspace_onboardings_user_id_status_idx" ON "workspace_onboardings"("user_id", "status");

CREATE TABLE "product_intakes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "marketplace" "Marketplace" NOT NULL,
  "product_id_type" VARCHAR(80),
  "materials" TEXT,
  "dimensions" TEXT,
  "feature_facts" JSONB NOT NULL DEFAULT '[]',
  "raw_product_info" TEXT,
  "source_files" JSONB NOT NULL DEFAULT '[]',
  "image_manifest" JSONB NOT NULL DEFAULT '[]',
  "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
  "status_message" TEXT,
  "queued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_intakes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_intakes_product_id_key" UNIQUE ("product_id"),
  CONSTRAINT "product_intakes_product_id_workspace_id_fkey" FOREIGN KEY ("product_id", "workspace_id") REFERENCES "products"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "product_intakes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "product_intakes_id_workspace_id_key" ON "product_intakes"("id", "workspace_id");
CREATE UNIQUE INDEX "product_intakes_product_id_workspace_id_key" ON "product_intakes"("product_id", "workspace_id");
CREATE INDEX "product_intakes_workspace_id_status_queued_at_idx" ON "product_intakes"("workspace_id", "status", "queued_at");
