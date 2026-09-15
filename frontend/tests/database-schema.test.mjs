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
  const record = { id: randomUUID(), ...values };
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
  ];
  for (const path of migrations)
    await db.exec(await readFile(new URL(path, import.meta.url), "utf8"));
  first = await fixture("first");
  second = await fixture("second");
});
after(async () => {
  await db?.close();
});

test("migrations create all 22 application tables and pgvector", async () => {
  const tables = await db.query(
    "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
  );
  assert.equal(tables.rows[0].count, 22);
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
