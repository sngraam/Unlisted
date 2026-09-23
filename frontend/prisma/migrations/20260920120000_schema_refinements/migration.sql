-- Migration: 20260920120000_schema_refinements
-- Apply 7 schema refinements for multi-chunk RAG, OCC revision history, category mapping, outbox events, token key versioning, partial unique indexes, and JSONB GIN indexes.

-- 1. Create brand_vector_chunks table
CREATE TABLE IF NOT EXISTS "brand_vector_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_context_id" UUID NOT NULL,
    "chunk_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_vector_chunks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "brand_vector_chunks_brand_context_id_fkey" FOREIGN KEY ("brand_context_id") REFERENCES "brand_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "brand_vector_chunks_brand_context_id_chunk_type_idx" ON "brand_vector_chunks"("brand_context_id", "chunk_type");

-- 2. Update marketplace_connections with key_version and last_refreshed_at
ALTER TABLE "marketplace_connections" 
ADD COLUMN IF NOT EXISTS "key_version" INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "last_refreshed_at" TIMESTAMPTZ(3);

-- 3. Update listing_revisions with parent_revision_id for OCC
ALTER TABLE "listing_revisions"
ADD COLUMN IF NOT EXISTS "parent_revision_id" UUID;

ALTER TABLE "listing_revisions"
ADD CONSTRAINT "listing_revisions_parent_revision_id_fkey" 
FOREIGN KEY ("parent_revision_id") REFERENCES "listing_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "listing_revisions_parent_revision_id_idx" ON "listing_revisions"("parent_revision_id");

-- 4. Create category_mappings table
CREATE TABLE IF NOT EXISTS "category_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amazon_product_type" VARCHAR(120) NOT NULL,
    "flipkart_vertical" VARCHAR(120) NOT NULL,
    "canonical_category" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "category_mappings_amazon_product_type_flipkart_vertical_key" 
ON "category_mappings"("amazon_product_type", "flipkart_vertical");

CREATE INDEX IF NOT EXISTS "category_mappings_canonical_category_idx" 
ON "category_mappings"("canonical_category");

-- 5. Create outbox_events table
CREATE TABLE IF NOT EXISTS "outbox_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "retry_count" INT NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");
CREATE INDEX IF NOT EXISTS "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");

-- 6. Partial Unique Index for Product Variants active SKUs (ignoring soft-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_workspace_sku_active_idx" 
ON "product_variants" ("workspace_id", "seller_sku") 
WHERE "deleted_at" IS NULL;

-- 7. GIN Indexes for fast JSONB querying on attributes
CREATE INDEX IF NOT EXISTS "idx_product_variants_attributes_gin" ON "product_variants" USING GIN ("attributes");
CREATE INDEX IF NOT EXISTS "idx_marketplace_payloads_raw_attributes_gin" ON "marketplace_payloads" USING GIN ("raw_attributes");
