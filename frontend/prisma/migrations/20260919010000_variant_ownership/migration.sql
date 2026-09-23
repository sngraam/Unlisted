BEGIN;
-- A SKU cannot escape its category assignment by being moved to a different parent.
CREATE FUNCTION guard_variant_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.product_id, NEW.workspace_id) IS DISTINCT FROM (OLD.product_id, OLD.workspace_id) THEN
    RAISE EXCEPTION 'A saved SKU cannot be moved to another product or workspace' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER variant_ownership_guard BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION guard_variant_ownership();
COMMIT;
