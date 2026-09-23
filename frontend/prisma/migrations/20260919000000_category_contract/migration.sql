BEGIN;

-- Stable merchant identity belongs in a typed column, independent of brand voice.
ALTER TABLE products ADD COLUMN brand_name VARCHAR(255);
UPDATE products p SET brand_name = COALESCE(NULLIF(btrim(p.canonical_data->>'brand'), ''), b.name)
FROM brand_contexts b WHERE b.id = p.brand_context_id AND b.workspace_id = p.workspace_id;
ALTER TABLE products ALTER COLUMN brand_name SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_brand_name_check CHECK (length(btrim(brand_name)) > 0);

CREATE TABLE product_marketplace_configs (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  platform "Marketplace" NOT NULL,
  marketplace_region VARCHAR(40) NOT NULL DEFAULT 'IN',
  template_id UUID NOT NULL,
  browse_node_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_marketplace_configs_product_fkey FOREIGN KEY (product_id, workspace_id)
    REFERENCES products(id, workspace_id) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT product_marketplace_configs_template_fkey FOREIGN KEY (template_id)
    REFERENCES marketplace_templates(id) ON DELETE RESTRICT,
  UNIQUE(product_id, platform, marketplace_region),
  UNIQUE(id, workspace_id)
);
CREATE INDEX product_marketplace_configs_workspace_platform_idx ON product_marketplace_configs(workspace_id, platform);
CREATE INDEX product_marketplace_configs_template_idx ON product_marketplace_configs(template_id);
ALTER TABLE marketplace_listings ADD COLUMN config_id UUID;
ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_config_fkey FOREIGN KEY (config_id, workspace_id)
  REFERENCES product_marketplace_configs(id, workspace_id) ON DELETE RESTRICT ON UPDATE NO ACTION;
CREATE INDEX marketplace_listings_config_idx ON marketplace_listings(config_id, workspace_id);

-- Preserve historical revisions. Bind current listings only, and refuse ambiguous families.
CREATE TEMP TABLE current_template_bindings ON COMMIT DROP AS
SELECT v.product_id, l.workspace_id, l.platform, l.marketplace_region, l.id AS listing_id,
       p.template_id, l.browse_node_id
FROM marketplace_listings l JOIN product_variants v ON v.id = l.variant_id
JOIN LATERAL (SELECT r.id FROM listing_revisions r WHERE r.listing_id = l.id ORDER BY r.number DESC LIMIT 1) r ON true
JOIN marketplace_payloads p ON p.revision_id = r.id WHERE p.template_id IS NOT NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM current_template_bindings GROUP BY product_id, platform, marketplace_region
             HAVING count(DISTINCT (template_id, browse_node_id)) > 1)
     OR EXISTS (SELECT 1 FROM current_template_bindings WHERE browse_node_id IS NULL) THEN
    RAISE EXCEPTION 'Conflicting category assignments: reconcile current variants before applying category_contract';
  END IF;
END $$;
INSERT INTO product_marketplace_configs(id, product_id, workspace_id, platform, marketplace_region, template_id, browse_node_id)
SELECT gen_random_uuid(), product_id, workspace_id, platform, marketplace_region, template_id, browse_node_id
FROM current_template_bindings GROUP BY product_id, workspace_id, platform, marketplace_region, template_id, browse_node_id;
UPDATE marketplace_listings l SET config_id = c.id
FROM product_marketplace_configs c, product_variants v
WHERE v.id = l.variant_id AND c.product_id = v.product_id AND c.workspace_id = l.workspace_id
AND c.platform = l.platform AND c.marketplace_region = l.marketplace_region;

CREATE FUNCTION guard_product_marketplace_config() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t marketplace_templates;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Saved product category and template cannot be changed' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO t FROM marketplace_templates WHERE id = NEW.template_id;
  IF t.id IS NULL THEN RETURN NEW; END IF; -- foreign key reports unknown template
  IF t.platform <> NEW.platform
     OR (NEW.platform = 'AMAZON' AND NEW.marketplace_region = 'IN' AND t.marketplace_id <> 'A21TJRUUN4KGV')
     OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(t.browse_nodes) n WHERE n->>'id' = NEW.browse_node_id) THEN
    RAISE EXCEPTION 'Category must match its marketplace template and browse node' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER product_marketplace_config_guard BEFORE INSERT OR UPDATE ON product_marketplace_configs
FOR EACH ROW EXECUTE FUNCTION guard_product_marketplace_config();

CREATE FUNCTION guard_listing_category() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c product_marketplace_configs; t marketplace_templates; parent_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.config_id IS NOT NULL AND
     (NEW.config_id, NEW.variant_id, NEW.workspace_id, NEW.platform, NEW.marketplace_region, NEW.product_type, NEW.browse_node_id)
     IS DISTINCT FROM (OLD.config_id, OLD.variant_id, OLD.workspace_id, OLD.platform, OLD.marketplace_region, OLD.product_type, OLD.browse_node_id) THEN
    RAISE EXCEPTION 'Saved listing category cannot be changed or removed' USING ERRCODE = '23514';
  END IF;
  SELECT product_id INTO parent_id FROM product_variants WHERE id = NEW.variant_id AND workspace_id = NEW.workspace_id;
  IF NEW.config_id IS NULL THEN
    IF NEW.product_type IS NOT NULL OR EXISTS (SELECT 1 FROM product_marketplace_configs
        WHERE product_id = parent_id AND platform = NEW.platform AND marketplace_region = NEW.marketplace_region) THEN
      RAISE EXCEPTION 'A category-bound product requires its saved configuration' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO c FROM product_marketplace_configs WHERE id = NEW.config_id;
  IF c.id IS NULL OR c.workspace_id <> NEW.workspace_id THEN RETURN NEW; END IF;
  SELECT * INTO t FROM marketplace_templates WHERE id = c.template_id;
  IF parent_id IS DISTINCT FROM c.product_id OR NEW.platform <> c.platform
     OR NEW.marketplace_region <> c.marketplace_region OR NEW.product_type IS DISTINCT FROM t.product_type
     OR NEW.browse_node_id IS DISTINCT FROM c.browse_node_id THEN
    RAISE EXCEPTION 'All variants must use their own product category configuration' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER listing_category_guard BEFORE INSERT OR UPDATE ON marketplace_listings
FOR EACH ROW EXECUTE FUNCTION guard_listing_category();

CREATE FUNCTION guard_template_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - 'is_active') IS DISTINCT FROM (to_jsonb(OLD) - 'is_active') THEN
    RAISE EXCEPTION 'Import a new template version instead of editing an existing version' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER template_version_guard BEFORE UPDATE ON marketplace_templates
FOR EACH ROW EXECUTE FUNCTION guard_template_version();

-- XLSM cell answers are a flat object of exact column keys to strings, not arbitrary JSON.
-- Typed Product/Variant/Revision facts are merged by the application when rendering/exporting.
CREATE FUNCTION guard_marketplace_payload() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t marketplace_templates; bound_template UUID; answer RECORD; f JSONB;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Save a new revision instead of overwriting reviewed attributes' USING ERRCODE = '23514';
  END IF;
  IF jsonb_typeof(NEW.raw_attributes) <> 'object' OR pg_column_size(NEW.raw_attributes) > 1048576 THEN
    RAISE EXCEPTION 'Attributes must be an object within the 1 MB limit' USING ERRCODE = '23514';
  END IF;
  SELECT c.template_id INTO bound_template FROM listing_revisions r
    JOIN marketplace_listings l ON l.id = r.listing_id
    JOIN product_marketplace_configs c ON c.id = l.config_id
    WHERE r.id = NEW.revision_id AND r.workspace_id = NEW.workspace_id;
  IF NEW.template_id IS NULL THEN
    IF NEW.raw_attributes <> '{}'::jsonb OR bound_template IS NOT NULL THEN
      RAISE EXCEPTION 'Dynamic attributes require a template version' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO t FROM marketplace_templates WHERE id = NEW.template_id;
  IF t.id IS NULL THEN RETURN NEW; END IF;
  IF bound_template IS DISTINCT FROM NEW.template_id OR NEW.category_code IS DISTINCT FROM t.product_type
     OR NEW.template_version IS DISTINCT FROM t.schema_sha256 THEN
    RAISE EXCEPTION 'Payload must reference the saved category and exact template version' USING ERRCODE = '23514';
  END IF;
  FOR answer IN SELECT * FROM jsonb_each(NEW.raw_attributes) LOOP
    SELECT value INTO f FROM jsonb_array_elements(t.fields) WHERE value->>'key' = answer.key;
    IF f IS NULL OR jsonb_typeof(answer.value) <> 'string' OR length(answer.value #>> '{}') > 30000 THEN
      RAISE EXCEPTION 'Unknown attribute or invalid cell value' USING ERRCODE = '23514';
    END IF;
    IF (f->>'attribute' = 'bullet_point' AND answer.key ~ '#[0-9]+\.value$')
       OR (f->>'attribute' IN ('contribution_sku', 'product_type', 'recommended_browse_nodes', 'item_name', 'brand', 'product_description', 'country_of_origin', 'color')
           AND answer.key ~ '#1\.value$') THEN
      RAISE EXCEPTION 'Core product facts cannot be duplicated in category attributes' USING ERRCODE = '23514';
    END IF;
    IF length(btrim(answer.value #>> '{}')) > 0 AND jsonb_array_length(COALESCE(f->'allowedValues', '[]'::jsonb)) > 0
       AND NOT (f->'allowedValues' @> jsonb_build_array(answer.value)) THEN
      RAISE EXCEPTION 'Attribute value is not allowed by the saved template' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER marketplace_payload_guard BEFORE INSERT OR UPDATE ON marketplace_payloads
FOR EACH ROW EXECUTE FUNCTION guard_marketplace_payload();

CREATE FUNCTION guard_listing_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Allow the existing author FK to become NULL on account deletion, retaining content history.
  IF (to_jsonb(NEW) - 'created_by_id') IS DISTINCT FROM (to_jsonb(OLD) - 'created_by_id') THEN
    RAISE EXCEPTION 'Listing revisions are immutable; append a new revision' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER listing_revision_guard BEFORE UPDATE ON listing_revisions
FOR EACH ROW EXECUTE FUNCTION guard_listing_revision();

-- Durable request identity and input version for the future queue worker.
ALTER TABLE generation_jobs ADD COLUMN idempotency_key VARCHAR(255), ADD COLUMN base_revision_id UUID, ADD COLUMN template_id UUID;
UPDATE generation_jobs SET idempotency_key = 'legacy:' || id::text;
ALTER TABLE generation_jobs ALTER COLUMN idempotency_key SET NOT NULL;
ALTER TABLE generation_jobs ADD CONSTRAINT generation_idempotency_nonempty CHECK (length(btrim(idempotency_key)) > 0);
CREATE UNIQUE INDEX generation_jobs_workspace_idempotency_key ON generation_jobs(workspace_id, idempotency_key);
ALTER TABLE generation_jobs ADD CONSTRAINT generation_base_revision_fkey FOREIGN KEY(base_revision_id, listing_id, workspace_id)
  REFERENCES listing_revisions(id, listing_id, workspace_id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE generation_jobs ADD CONSTRAINT generation_template_fkey FOREIGN KEY(template_id) REFERENCES marketplace_templates(id) ON DELETE RESTRICT;
CREATE INDEX generation_jobs_base_revision_idx ON generation_jobs(base_revision_id, listing_id, workspace_id);
CREATE INDEX generation_jobs_template_idx ON generation_jobs(template_id);
CREATE UNIQUE INDEX listing_revisions_one_generation_output ON listing_revisions(generation_job_id) WHERE generation_job_id IS NOT NULL;

CREATE FUNCTION guard_generation_input() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND
    (NEW.listing_id, NEW.workspace_id, NEW.idempotency_key, NEW.template_id, NEW.base_revision_id, NEW.input_snapshot)
    IS DISTINCT FROM (OLD.listing_id, OLD.workspace_id, OLD.idempotency_key, OLD.template_id, OLD.base_revision_id, OLD.input_snapshot) THEN
    RAISE EXCEPTION 'Generation inputs are immutable' USING ERRCODE = '23514';
  END IF;
  SELECT c.template_id INTO expected FROM marketplace_listings l JOIN product_marketplace_configs c ON c.id=l.config_id WHERE l.id=NEW.listing_id;
  IF TG_OP = 'INSERT' AND expected IS NOT NULL AND (NEW.template_id IS DISTINCT FROM expected OR NEW.base_revision_id IS NULL) THEN
    RAISE EXCEPTION 'Generation must pin its category and input revision' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER generation_input_guard BEFORE INSERT OR UPDATE ON generation_jobs FOR EACH ROW EXECUTE FUNCTION guard_generation_input();

CREATE FUNCTION guard_generation_output() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE base_id UUID; latest_id UUID;
BEGIN
  -- Lock the listing so manual and generated saves serialize around the same latest revision.
  PERFORM 1 FROM marketplace_listings WHERE id=NEW.listing_id FOR UPDATE;
  IF NEW.generation_job_id IS NULL THEN RETURN NEW; END IF;
  SELECT base_revision_id INTO base_id FROM generation_jobs WHERE id=NEW.generation_job_id;
  SELECT id INTO latest_id FROM listing_revisions WHERE listing_id=NEW.listing_id ORDER BY number DESC LIMIT 1;
  IF base_id IS DISTINCT FROM latest_id THEN
    RAISE EXCEPTION 'Generation result is stale; preserve the newer manual revision' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER generation_output_guard BEFORE INSERT ON listing_revisions FOR EACH ROW EXECUTE FUNCTION guard_generation_output();

COMMIT;
