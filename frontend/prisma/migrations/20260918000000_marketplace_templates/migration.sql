-- Versioned Amazon/Flipkart category definitions. Additive: existing listings/payloads remain valid.
BEGIN;

CREATE TABLE "marketplace_templates" (
    "id" UUID NOT NULL,
    "platform" "Marketplace" NOT NULL,
    "marketplace_id" VARCHAR(120) NOT NULL,
    "product_type" VARCHAR(120) NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "source_filename" VARCHAR(255) NOT NULL,
    "source_sha256" CHAR(64) NOT NULL,
    "schema_sha256" CHAR(64) NOT NULL,
    "parser_version" INTEGER NOT NULL,
    "field_count" INTEGER NOT NULL,
    "fields" JSONB NOT NULL,
    "browse_nodes" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "imported_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketplace_templates_fields_array_check" CHECK (jsonb_typeof("fields") = 'array'),
    CONSTRAINT "marketplace_templates_browse_nodes_array_check" CHECK (jsonb_typeof("browse_nodes") = 'array'),
    CONSTRAINT "marketplace_templates_field_count_check" CHECK ("field_count" > 0),
    CONSTRAINT "marketplace_templates_source_hash_check" CHECK ("source_sha256" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "marketplace_templates_schema_hash_check" CHECK ("schema_sha256" ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX "marketplace_templates_scope_version_key"
  ON "marketplace_templates"("platform", "marketplace_id", "product_type", "language", "schema_sha256");
CREATE INDEX "marketplace_templates_lookup_idx"
  ON "marketplace_templates"("platform", "marketplace_id", "product_type", "language", "is_active");
CREATE UNIQUE INDEX "marketplace_templates_one_active_per_scope"
  ON "marketplace_templates"("platform", "marketplace_id", "product_type", "language")
  WHERE "is_active";

ALTER TABLE "marketplace_listings" ADD COLUMN "product_type" VARCHAR(120);
ALTER TABLE "marketplace_listings" ADD COLUMN "browse_node_id" VARCHAR(120);
ALTER TABLE "marketplace_payloads" ADD COLUMN "template_id" UUID;
CREATE INDEX "marketplace_payloads_template_id_idx" ON "marketplace_payloads"("template_id");
ALTER TABLE "marketplace_payloads" ADD CONSTRAINT "marketplace_payloads_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "marketplace_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
