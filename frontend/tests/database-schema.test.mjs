// Executes the real migration in an isolated in-memory PostgreSQL engine.
// Never reads DATABASE_URL or connects to a user's application database.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";

let db, first, second;
let revisionNumber = 0;
const updatedTables = new Set([
  "users",
  "teams",
  "team_memberships",
  "folders",
  "workspaces",
  "brand_contexts",
  "marketplace_connections",
  "products",
  "product_variants",
  "marketplace_listings",
]);
async function insert(table, values) {
  const record = { id: randomUUID(), ...(table === "products" ? { brand_name: "Test brand" } : {}), ...values };
  if (updatedTables.has(table)) record.updated_at = new Date();
  const columns = Object.keys(record);
  const result = await db.query(
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
    Object.values(record),
  );
  return result.rows[0];
}
async function fixture(label) {
  const user = await insert("users", {
    email: `${label}@example.com`,
    display_name: label,
  });
  const team = await insert("teams", { name: label, created_by_id: user.id });
  const folder = await insert("folders", { name: label, team_id: team.id });
  const workspace = await insert("workspaces", {
    name: label,
    team_id: team.id,
    folder_id: folder.id,
  });
  const brand = await insert("brand_contexts", {
    name: label,
    workspace_id: workspace.id,
  });
  const product = await insert("products", {
    name: "Cotton Kurta",
    workspace_id: workspace.id,
    brand_context_id: brand.id,
  });
  const variant = await insert("product_variants", {
    product_id: product.id,
    workspace_id: workspace.id,
    seller_sku: "SKU-001",
    mrp: "2499.00",
    selling_price: "1799.00",
    stock: 42,
  });
  const connection = await insert("marketplace_connections", {
    workspace_id: workspace.id,
    platform: "AMAZON",
    seller_id: label,
  });
  const listing = await insert("marketplace_listings", {
    workspace_id: workspace.id,
    variant_id: variant.id,
    connection_id: connection.id,
    platform: "AMAZON",
  });
  return {
    user,
    team,
    folder,
    workspace,
    brand,
    product,
    variant,
    connection,
    listing,
  };
}
function revision(scope = first) {
  return insert("listing_revisions", {
    listing_id: scope.listing.id,
    workspace_id: scope.workspace.id,
    number: ++revisionNumber,
    title: "Sample cotton kurta listing",
  });
}
async function reviewed(scope = first) {
  const rev = await revision(scope);
  await insert("marketplace_payloads", {
    revision_id: rev.id,
    workspace_id: scope.workspace.id,
  });
  const audit = await insert("validation_runs", {
    revision_id: rev.id,
    workspace_id: scope.workspace.id,
    status: "PASSED",
    ruleset_version: "test-v1",
    score: 100,
    completed_at: new Date(),
  });
  const approval = await insert("listing_approvals", {
    revision_id: rev.id,
    workspace_id: scope.workspace.id,
    validation_run_id: audit.id,
    approved_by_id: scope.user.id,
  });
  return { rev, audit, approval };
}
function jobValues(review, scope = first) {
  return {
    revision_id: review.rev.id,
    listing_id: scope.listing.id,
    workspace_id: scope.workspace.id,
    platform: "AMAZON",
    approval_id: review.approval.id,
    route: "FLAT_FILE_CSV",
    idempotency_key: randomUUID(),
  };
}
const rejectsCode = (promise, code) =>
  assert.rejects(promise, (error) => error.code === code);

before(async () => {
  db = await PGlite.create({ extensions: { vector } });
  const migrations = [
    "../prisma/migrations/20260913000000_initial_catalog/migration.sql",
    "../prisma/migrations/20260913010000_sessions/migration.sql",
    "../prisma/migrations/20260915000000_usernames/migration.sql",
    "../prisma/migrations/20260918000000_marketplace_templates/migration.sql",
    "../prisma/migrations/20260919000000_category_contract/migration.sql",
    "../prisma/migrations/20260919010000_variant_ownership/migration.sql",
    "../prisma/migrations/20260919020000_template_source_metadata/migration.sql",
    "../prisma/migrations/20260923100000_onboarding_product_intake/migration.sql",
  ];
  for (const path of migrations)
    await db.exec(await readFile(new URL(path, import.meta.url), "utf8"));
  first = await fixture("first");
  second = await fixture("second");
});
after(async () => {
  await db?.close();
});

test("migrations create all 26 application tables and pgvector", async () => {
  const tables = await db.query(
    "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
  );
  assert.equal(tables.rows[0].count, 26);
  const extension = await db.query(
    "SELECT extname FROM pg_extension WHERE extname='vector'",
  );
  assert.equal(extension.rows[0].extname, "vector");
});
test("login IDs are optional, normalized, and unique", async () => {
  await insert("users", {
    username: "seller.one",
    email: "seller-one@example.com",
    display_name: "Seller One",
  });
  await rejectsCode(
    insert("users", {
      username: "Seller.Two",
      email: "seller-two@example.com",
      display_name: "Seller Two",
    }),
    "23514",
  );
  await rejectsCode(
    insert("users", {
      username: "seller.one",
      email: "seller-three@example.com",
      display_name: "Seller Three",
    }),
    "23505",
  );
});
test("workspace cannot use another team’s folder", async () => {
  await rejectsCode(
    insert("workspaces", {
      name: "Invalid",
      team_id: first.team.id,
      folder_id: second.folder.id,
    }),
    "23503",
  );
});
test("product cannot use a brand from another workspace", async () => {
  await rejectsCode(
    insert("products", {
      name: "Invalid",
      workspace_id: first.workspace.id,
      brand_context_id: second.brand.id,
    }),
    "23503",
  );
});
test("variant cannot claim a different workspace from its parent", async () => {
  await rejectsCode(
    insert("product_variants", {
      product_id: first.product.id,
      workspace_id: second.workspace.id,
      seller_sku: "CROSS-TENANT",
    }),
    "23503",
  );
});
test("SKUs are case-insensitively unique within a workspace but reusable in another", async () => {
  assert.equal(first.variant.seller_sku, second.variant.seller_sku);
  await rejectsCode(
    insert("product_variants", {
      product_id: first.product.id,
      workspace_id: first.workspace.id,
      seller_sku: "sku-001",
    }),
    "23505",
  );
});
test("invalid prices, NaN, negative inventory, and blank SKUs are rejected", async () => {
  for (const invalid of [
    { mrp: "10", selling_price: "11" },
    { mrp: "NaN" },
    { stock: -1 },
    { seller_sku: "  " },
  ]) {
    await rejectsCode(
      insert("product_variants", {
        product_id: first.product.id,
        workspace_id: first.workspace.id,
        seller_sku: randomUUID(),
        ...invalid,
      }),
      "23514",
    );
  }
});
test("prices retain exact decimal arithmetic", async () => {
  const variant = await insert("product_variants", {
    product_id: first.product.id,
    workspace_id: first.workspace.id,
    seller_sku: randomUUID(),
    mrp: "0.30",
    selling_price: "0.10",
  });
  const result = await db.query(
    "SELECT (selling_price + 0.20)::text AS amount FROM product_variants WHERE id=$1",
    [variant.id],
  );
  assert.equal(result.rows[0].amount, "0.30");
});
test("one variant can have a draft on each marketplace without OAuth", async () => {
  const listing = await insert("marketplace_listings", {
    workspace_id: first.workspace.id,
    variant_id: first.variant.id,
    platform: "FLIPKART",
  });
  assert.equal(listing.connection_id, null);
  await rejectsCode(
    insert("marketplace_listings", {
      workspace_id: first.workspace.id,
      variant_id: first.variant.id,
      platform: "FLIPKART",
    }),
    "23505",
  );
});
test("a listing cannot bind a connection from another workspace or platform", async () => {
  await rejectsCode(
    db.query("UPDATE marketplace_listings SET connection_id=$1 WHERE id=$2", [
      second.connection.id,
      first.listing.id,
    ]),
    "23503",
  );
  const flipkart = await insert("marketplace_connections", {
    workspace_id: first.workspace.id,
    platform: "FLIPKART",
    seller_id: "flipkart-first",
  });
  await rejectsCode(
    db.query("UPDATE marketplace_listings SET connection_id=$1 WHERE id=$2", [
      flipkart.id,
      first.listing.id,
    ]),
    "23503",
  );
});
test("a validation result and approval must refer to the same revision", async () => {
  const a = await reviewed();
  const b = await revision();
  await rejectsCode(
    insert("listing_approvals", {
      revision_id: b.id,
      workspace_id: first.workspace.id,
      validation_run_id: a.audit.id,
      approved_by_id: first.user.id,
    }),
    "23503",
  );
});
test("a publish job cannot borrow approval from another revision", async () => {
  const a = await reviewed();
  const b = await reviewed();
  await rejectsCode(
    insert("publish_jobs", { ...jobValues(a), approval_id: b.approval.id }),
    "23503",
  );
});
test("only one active approval is allowed; revoked approvals remain historical", async () => {
  const a = await reviewed();
  const values = {
    revision_id: a.rev.id,
    workspace_id: first.workspace.id,
    validation_run_id: a.audit.id,
    approved_by_id: first.user.id,
  };
  await rejectsCode(insert("listing_approvals", values), "23505");
  await db.query("UPDATE listing_approvals SET revoked_at=now() WHERE id=$1", [
    a.approval.id,
  ]);
  await insert("listing_approvals", values);
});
test("CSV jobs cannot report live publication and API jobs require a connection", async () => {
  const a = await reviewed();
  await rejectsCode(
    insert("publish_jobs", {
      ...jobValues(a),
      status: "PUBLISHED",
      submission_id: "sample",
      submitted_at: new Date(),
      published_at: new Date(),
      completed_at: new Date(),
    }),
    "23514",
  );
  await rejectsCode(
    insert("publish_jobs", { ...jobValues(a), route: "DIRECT_API" }),
    "23514",
  );
  const valid = await insert("publish_jobs", {
    ...jobValues(a),
    route: "DIRECT_API",
    connection_id: first.connection.id,
  });
  assert.equal(valid.status, "QUEUED");
});
test("publish target must match both the revision’s platform and workspace", async () => {
  const a = await reviewed();
  await rejectsCode(
    insert("publish_jobs", { ...jobValues(a), platform: "FLIPKART" }),
    "23503",
  );
  await rejectsCode(
    insert("publish_jobs", {
      ...jobValues(a),
      route: "DIRECT_API",
      connection_id: second.connection.id,
    }),
    "23503",
  );
});
test("CSV export requires a result asset owned by the same workspace", async () => {
  const a = await reviewed();
  const asset = await insert("media_assets", {
    workspace_id: first.workspace.id,
    kind: "CSV",
    storage_key: randomUUID(),
    original_name: "listing.csv",
    mime_type: "text/csv",
    size_bytes: 100,
  });
  const result = await insert("publish_jobs", {
    ...jobValues(a),
    status: "EXPORT_READY",
    export_asset_id: asset.id,
    completed_at: new Date(),
  });
  assert.equal(result.status, "EXPORT_READY");
  const foreign = await insert("media_assets", {
    workspace_id: second.workspace.id,
    kind: "CSV",
    storage_key: randomUUID(),
    original_name: "other.csv",
    mime_type: "text/csv",
    size_bytes: 100,
  });
  await rejectsCode(
    insert("publish_jobs", {
      ...jobValues(a),
      status: "EXPORT_READY",
      export_asset_id: foreign.id,
      completed_at: new Date(),
    }),
    "23503",
  );
});
test("validation score and terminal result shape are checked by PostgreSQL", async () => {
  const rev = await revision();
  for (const invalid of [
    { score: 101 },
    { status: "PASSED", errors: '["failure"]', completed_at: new Date() },
  ]) {
    await rejectsCode(
      insert("validation_runs", {
        revision_id: rev.id,
        workspace_id: first.workspace.id,
        ruleset_version: "test-v1",
        ...invalid,
      }),
      "23514",
    );
  }
});
test("pgvector stores the configured 1536-dimensional brand embedding", async () => {
  await db.query("UPDATE brand_contexts SET embedding=$1::vector WHERE id=$2", [
    JSON.stringify(Array(1536).fill(0)),
    first.brand.id,
  ]);
  const result = await db.query(
    "SELECT vector_dims(embedding) AS dimensions FROM brand_contexts WHERE id=$1",
    [first.brand.id],
  );
  assert.equal(result.rows[0].dimensions, 1536);
});
test("template versions keep one active category while old payloads retain provenance", async () => {
  const template = {
    platform: "AMAZON",
    marketplace_id: "A21TJRUUN4KGV",
    product_type: "KURTA",
    language: "en_IN",
    source_filename: "KURTA.xlsm",
    source_sha256: "a".repeat(64),
    schema_sha256: "b".repeat(64),
    parser_version: 1,
    field_count: 1,
    fields: JSON.stringify([{ key: "product_type#1.value" }]),
    browse_nodes: JSON.stringify([{ id: "123", path: "Clothing > Kurtas" }]),
  };
  const oldVersion = await insert("marketplace_templates", template);
  await rejectsCode(
    insert("marketplace_templates", { ...template, schema_sha256: "c".repeat(64) }),
    "23505",
  );
  const rev = await revision();
  const config = await insert("product_marketplace_configs", {
    product_id: first.product.id, workspace_id: first.workspace.id, platform: "AMAZON",
    template_id: oldVersion.id, browse_node_id: "123",
  });
  await db.query("UPDATE marketplace_listings SET config_id=$1, product_type='KURTA', browse_node_id='123' WHERE id=$2", [config.id, first.listing.id]);
  await insert("marketplace_payloads", {
    revision_id: rev.id,
    workspace_id: first.workspace.id,
    template_id: oldVersion.id,
    category_code: "KURTA",
    template_version: oldVersion.schema_sha256,
  });
  await db.query("UPDATE marketplace_templates SET is_active=false WHERE id=$1", [oldVersion.id]);
  const newVersion = await insert("marketplace_templates", {
    ...template,
    schema_sha256: "c".repeat(64),
  });
  assert.equal(newVersion.is_active, true);
  const payload = await db.query("SELECT template_id FROM marketplace_payloads WHERE revision_id=$1", [rev.id]);
  assert.equal(payload.rows[0].template_id, oldVersion.id);
  await assert.rejects(
    db.query("DELETE FROM marketplace_templates WHERE id=$1", [oldVersion.id]),
    (error) => ["23001", "23503"].includes(error.code),
  );
});

test("category bindings reject changes, invalid nodes and another product's configuration", async () => {
  const c = (await db.query("SELECT * FROM product_marketplace_configs WHERE product_id=$1", [first.product.id])).rows[0];
  await rejectsCode(db.query("UPDATE product_marketplace_configs SET browse_node_id='999' WHERE id=$1", [c.id]), "23514");
  await rejectsCode(db.query("UPDATE marketplace_listings SET config_id=NULL WHERE id=$1", [first.listing.id]), "23514");
  await rejectsCode(db.query("UPDATE marketplace_listings SET product_type='PANTS' WHERE id=$1", [first.listing.id]), "23514");
  const other = await insert("products", { name: "Other", workspace_id: first.workspace.id, brand_context_id: first.brand.id });
  const variant = await insert("product_variants", { product_id: other.id, workspace_id: first.workspace.id, seller_sku: randomUUID() });
  await rejectsCode(db.query("UPDATE product_variants SET product_id=$1 WHERE id=$2", [other.id, first.variant.id]), "23514");
  await rejectsCode(insert("marketplace_listings", { variant_id: variant.id, workspace_id: first.workspace.id, platform: "AMAZON", config_id: c.id, product_type: "KURTA", browse_node_id: "123" }), "23514");
  await rejectsCode(insert("product_marketplace_configs", { product_id: second.product.id, workspace_id: second.workspace.id, platform: "AMAZON", template_id: c.template_id, browse_node_id: "missing" }), "23514");
  await rejectsCode(insert("product_marketplace_configs", { product_id: second.product.id, workspace_id: first.workspace.id, platform: "AMAZON", template_id: c.template_id, browse_node_id: "123" }), "23503");
});

test("JSONB answers use exact template keys and strings, and reviewed records stay immutable", async () => {
  const scope = await fixture("attribute-test");
  const t = await insert("marketplace_templates", {
    platform: "AMAZON", marketplace_id: "A21TJRUUN4KGV", product_type: "TEST", language: "en_IN",
    source_filename: "TEST.xlsm", source_sha256: "d".repeat(64), schema_sha256: "e".repeat(64), parser_version: 2,
    field_count: 3,
    fields: JSON.stringify([
      { key: "fabric#1.value", attribute: "fabric", allowedValues: ["Cotton", "Linen"] },
      { key: "fabric#2.value", attribute: "fabric" },
      { key: "brand#1.value", attribute: "brand" },
    ]),
    browse_nodes: JSON.stringify([{ id: "456", path: "Test" }]),
  });
  const c = await insert("product_marketplace_configs", { product_id: scope.product.id, workspace_id: scope.workspace.id, platform: "AMAZON", template_id: t.id, browse_node_id: "456" });
  await db.query("UPDATE marketplace_listings SET config_id=$1, product_type='TEST', browse_node_id='456' WHERE id=$2", [c.id, scope.listing.id]);
  for (const attributes of [{ unknown: "x" }, { "fabric#1.value": 5 }, { "fabric#1.value": { value: "Cotton" } }, { "fabric#1.value": "Silk" }, { "brand#1.value": "Override" }]) {
    const r = await revision(scope);
    await rejectsCode(insert("marketplace_payloads", { revision_id: r.id, workspace_id: scope.workspace.id, template_id: t.id, template_version: t.schema_sha256, category_code: "TEST", raw_attributes: JSON.stringify(attributes) }), "23514");
  }
  const r = await revision(scope);
  await rejectsCode(insert("marketplace_payloads", { revision_id: r.id, workspace_id: scope.workspace.id }), "23514");
  const payload = await insert("marketplace_payloads", { revision_id: r.id, workspace_id: scope.workspace.id, template_id: t.id, template_version: t.schema_sha256, category_code: "TEST", raw_attributes: JSON.stringify({ "fabric#1.value": "Cotton", "fabric#2.value": "Other repeat" }) });
  await rejectsCode(db.query("UPDATE marketplace_payloads SET raw_attributes='{}' WHERE id=$1", [payload.id]), "23514");
  await rejectsCode(db.query("UPDATE listing_revisions SET title='rewritten' WHERE id=$1", [r.id]), "23514");
  await rejectsCode(db.query("UPDATE marketplace_templates SET fields='[]' WHERE id=$1", [t.id]), "23514");
  const next = await revision(scope);
  await rejectsCode(insert("marketplace_payloads", { revision_id: next.id, workspace_id: scope.workspace.id, template_id: t.id, template_version: "f".repeat(64), category_code: "TEST" }), "23514");
});

test("typed product brand cannot be blank", async () => {
  await rejectsCode(db.query("UPDATE products SET brand_name=' ' WHERE id=$1", [first.product.id]), "23514");
});

test("source metadata is complete, source-bound and immutable; workbook suggestions accept custom values", async () => {
  const scope = await fixture("source-metadata");
  const t = await insert("marketplace_templates", {
    platform: "AMAZON", marketplace_id: "A21TJRUUN4KGV", product_type: "METADATA", language: "en_IN",
    source_filename: "METADATA.xlsm", source_sha256: "1".repeat(64), schema_sha256: "2".repeat(64), parser_version: 2,
    field_count: 2,
    fields: JSON.stringify([
      { key: "price#1.value", pattern: "price#*.value", attribute: "price", allowedValues: ["Delete Offer"] },
      { key: "id_type", pattern: "id_type", attribute: "id_type", allowedValues: ["UPC"] },
    ]), browse_nodes: JSON.stringify([{ id: "456", path: "Metadata" }]),
  });
  const metadata = { version: 1, sourceSha256: t.source_sha256, definitions: [
    { pattern: "price#*.value", row: 4, example: "259.99" },
    { pattern: "id_type", row: 5, example: "UPC" },
  ], suggestedChoiceKeys: ["price#1.value"] };
  for (const invalid of [{ ...metadata, sourceSha256: "0".repeat(64) }, { ...metadata, definitions: metadata.definitions.slice(0, 1) }, { ...metadata, suggestedChoiceKeys: ["unknown"] }])
    await rejectsCode(db.query("UPDATE marketplace_templates SET source_metadata=$1 WHERE id=$2", [JSON.stringify(invalid), t.id]), "23514");
  await db.query("UPDATE marketplace_templates SET source_metadata=$1 WHERE id=$2", [JSON.stringify(metadata), t.id]);
  await rejectsCode(db.query("UPDATE marketplace_templates SET source_metadata=NULL WHERE id=$1", [t.id]), "23514");
  await rejectsCode(db.query("UPDATE marketplace_templates SET source_metadata=$1 WHERE id=$2", [JSON.stringify({ ...metadata, suggestedChoiceKeys: [] }), t.id]), "23514");
  const c = await insert("product_marketplace_configs", { product_id: scope.product.id, workspace_id: scope.workspace.id, platform: "AMAZON", template_id: t.id, browse_node_id: "456" });
  await db.query("UPDATE marketplace_listings SET config_id=$1, product_type='METADATA', browse_node_id='456' WHERE id=$2", [c.id, scope.listing.id]);
  const r = await revision(scope);
  await insert("marketplace_payloads", { revision_id: r.id, workspace_id: scope.workspace.id, template_id: t.id, template_version: t.schema_sha256, category_code: "METADATA", raw_attributes: JSON.stringify({ "price#1.value": "259.99", id_type: "UPC" }) });
  const next = await revision(scope);
  await rejectsCode(insert("marketplace_payloads", { revision_id: next.id, workspace_id: scope.workspace.id, template_id: t.id, template_version: t.schema_sha256, category_code: "METADATA", raw_attributes: JSON.stringify({ id_type: "INVALID" }) }), "23514");
});

test("generation requests are idempotent and stale results cannot replace manual edits", async () => {
  const c = (await db.query("SELECT * FROM product_marketplace_configs WHERE product_id=$1", [first.product.id])).rows[0];
  const base = await revision();
  const values = { listing_id: first.listing.id, workspace_id: first.workspace.id, template_id: c.template_id, base_revision_id: base.id, idempotency_key: randomUUID() };
  const job = await insert("generation_jobs", values);
  await rejectsCode(insert("generation_jobs", values), "23505");
  const foreign = await revision(second);
  await rejectsCode(insert("generation_jobs", { ...values, idempotency_key: randomUUID(), base_revision_id: foreign.id }), "23503");
  const manual = await revision();
  await rejectsCode(insert("listing_revisions", { listing_id: first.listing.id, workspace_id: first.workspace.id, number: ++revisionNumber, generation_job_id: job.id }), "23514");
  const nextJob = await insert("generation_jobs", { ...values, idempotency_key: randomUUID(), base_revision_id: manual.id });
  const generated = await insert("listing_revisions", { listing_id: first.listing.id, workspace_id: first.workspace.id, number: ++revisionNumber, generation_job_id: nextJob.id, title: "Generated from current input" });
  assert.equal(generated.generation_job_id, nextJob.id);
  await rejectsCode(db.query("UPDATE generation_jobs SET input_snapshot='{\"changed\":true}' WHERE id=$1", [nextJob.id]), "23514");
});
