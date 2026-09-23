// Local-only acceptance check: seeded product families carry pinned template payloads per SKU.
import assert from "node:assert/strict";
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
import { PrismaClient } from "../frontend/generated/prisma/client";
import { PrismaPg } from "../frontend/node_modules/@prisma/adapter-pg";
config({ path: "../frontend/.env.local" });
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.pathname, "/listing_agent_local");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), max: 1 }) });
async function main() {
try {
  const user = await prisma.user.findUniqueOrThrow({ where: { username: "sngram" } });
  const membership = await prisma.teamMembership.findFirstOrThrow({ where: { userId: user.id, role: "OWNER" }, include: { team: { include: { workspaces: true } } } });
  const workspaceId = membership.team.workspaces[0].id;
  const samples = await prisma.product.findMany({
    where: { workspaceId, deletedAt: null, name: { contains: "Sample" } },
    include: { variants: { include: { listings: { include: { revisions: { include: { payload: { include: { template: true } } } } } } } } },
  });
  assert.equal(samples.length, 4);
  assert.equal(samples.reduce((count, item) => count + item.variants.length, 0), 8);
  assert.deepEqual(new Set(samples.flatMap((item) => item.variants.flatMap((variant) => variant.listings.map((listing) => listing.productType)))), new Set(["KURTA", "PANTS", "SHIRT", "SHORTS"]));
  for (const product of samples)
    for (const variant of product.variants) {
      const listing = variant.listings[0];
      const payload = listing.revisions[0].payload;
      assert.ok(payload?.template?.isActive);
      assert.equal(payload?.categoryCode, listing.productType);
      assert.equal(payload?.templateVersion, payload?.template?.schemaSha256);
      assert.ok(Object.keys(payload?.rawAttributes as object).length >= 6);
      assert.equal(listing.publicationStatus, "NEVER_PUBLISHED");
    }
  const archived = await prisma.product.count({ where: { workspaceId, deletedAt: { not: null } } });
  assert.ok(archived >= 12);
  console.log("PASS: four visible XLSM-based sample families, eight pinned SKU payloads, twelve archived legacy fixtures.");
} finally {
  await prisma.$disconnect();
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
