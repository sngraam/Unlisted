-- Enrich a pinned template from the exact same XLSM without rewriting its schema.
ALTER TABLE marketplace_templates ADD COLUMN source_metadata JSONB;

CREATE OR REPLACE FUNCTION guard_template_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'is_active' - 'source_metadata') IS DISTINCT FROM (to_jsonb(OLD) - 'is_active' - 'source_metadata')
       OR (OLD.source_metadata IS NOT NULL AND NEW.source_metadata IS DISTINCT FROM OLD.source_metadata) THEN
      RAISE EXCEPTION 'Import a new template version instead of editing an existing version' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.source_metadata IS NOT NULL THEN
    IF jsonb_typeof(NEW.source_metadata) IS DISTINCT FROM 'object'
       OR NEW.source_metadata->>'sourceSha256' IS DISTINCT FROM NEW.source_sha256::text
       OR NEW.source_metadata->>'version' IS DISTINCT FROM '1'
       OR jsonb_typeof(NEW.source_metadata->'definitions') IS DISTINCT FROM 'array'
       OR jsonb_typeof(NEW.source_metadata->'suggestedChoiceKeys') IS DISTINCT FROM 'array'
       OR pg_column_size(NEW.source_metadata) > 1048576 THEN
      RAISE EXCEPTION 'Invalid template source metadata' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW.source_metadata->'definitions') d
      WHERE jsonb_typeof(d->'example') IS DISTINCT FROM 'string'
         OR jsonb_typeof(d->'row') IS DISTINCT FROM 'number'
         OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.fields) f WHERE f->>'pattern' = d->>'pattern')
    ) OR (SELECT count(*) FROM jsonb_array_elements(NEW.source_metadata->'definitions')) <>
         (SELECT count(DISTINCT f->>'pattern') FROM jsonb_array_elements(NEW.fields) f)
      OR (SELECT count(DISTINCT d->>'pattern') FROM jsonb_array_elements(NEW.source_metadata->'definitions') d) <>
         (SELECT count(*) FROM jsonb_array_elements(NEW.source_metadata->'definitions'))
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(NEW.source_metadata->'suggestedChoiceKeys') k
        WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.fields) f WHERE f->>'key' = k AND f->>'attribute' <> 'product_type')
      ) THEN
      RAISE EXCEPTION 'Source metadata must cover exactly this template definitions' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER template_version_guard ON marketplace_templates;
CREATE TRIGGER template_version_guard BEFORE INSERT OR UPDATE ON marketplace_templates
FOR EACH ROW EXECUTE FUNCTION guard_template_version();

CREATE OR REPLACE FUNCTION guard_marketplace_payload() RETURNS trigger LANGUAGE plpgsql AS $$
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
       AND NOT COALESCE(t.source_metadata->'suggestedChoiceKeys' ? answer.key, false)
       AND NOT (f->'allowedValues' @> jsonb_build_array(answer.value)) THEN
      RAISE EXCEPTION 'Attribute value is not allowed by the saved template' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
