// Explicit local-only refresh of the four known synthetic fixtures. Append revisions
// through the same authenticated product API as the editor; never rewrite history.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
import { PrismaClient } from "../frontend/generated/prisma/client";
import { PrismaPg } from "../frontend/node_modules/@prisma/adapter-pg";
import { createHash } from "node:crypto";
config({ path: ".env.local" });
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.pathname, "/listing_agent_local");
if (!process.argv.includes("--apply")) throw new Error("Use --apply to refresh only the known local demo products.");
const origin = "http://localhost:3000";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
const seed = JSON.parse(readFileSync("../test/seed-data.json", "utf8"));
function id(key: string) {
  const h = createHash("sha256").update("listing-agent-local:" + key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function main() {
  const login = await fetch(origin + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ identifier: seed.profile.username, password: "sngram" }) });
  assert.equal(login.status, 200, "Local demo login failed");
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const headers = { "Content-Type": "application/json", Origin: origin, Cookie: cookie };
  try {
    const response = await fetch(origin + "/api/workspace", { headers });
    assert.equal(response.status, 200);
    const workspace = await response.json();
    const updates = seed.products.map((sample: any) => {
      const current = workspace.products.find((p: any) => p.id === id("product:" + sample.id));
      assert.ok(current && current.name.includes("Sample"), `Known sample ${sample.id} missing; refusing to overwrite another product`);
      assert.equal(current.productType, sample.productType);
      assert.equal(current.browseNodeId, sample.browseNodeId);
      const variants = sample.variants.map((v: any) => {
        const old = current.variants.find((row: any) => row.sku === v.sku && row.sku.startsWith("DEMO-"));
        assert.ok(old, "Expected demo SKU not found");
        return { ...old, ...v, id: old.id };
      });
      return { current, sample, input: { ...current, ...sample, id: current.id, updatedAt: current.updatedAt, templateId: current.templateId, variants } };
    });
    const backup = `/tmp/listing-examples-before-${Date.now()}.json`;
    writeFileSync(backup, JSON.stringify(updates.map((u: any) => u.current), null, 2), { mode: 0o600, flag: "wx" });
    console.log(`Current sample values backed up at ${backup}`);
    for (const { current, sample, input } of updates) {
      const row = await prisma.product.findUniqueOrThrow({ where: { id: current.id } });
      const facts = row.canonicalData as Record<string, any>;
      if (facts.workbookExample?.sourceSha256 === sample.workbookExample.sourceSha256) {
        console.log(`${sample.productType}: examples already applied; keeping later edits`);
        continue;
      }
      const result = await fetch(origin + `/api/products/${current.id}`, { method: "PUT", headers, body: JSON.stringify(input) });
      const saved = await result.json();
      assert.equal(result.status, 200, JSON.stringify(saved));
      const product = saved.products.find((p: any) => p.id === current.id);
      assert.ok(product && !product.approved);
      for (const variant of product.variants) {
        const expected = input.variants.find((v: any) => v.id === variant.id);
        assert.deepEqual(variant.channelAttributes, expected.channelAttributes, "Exact example keys must round-trip");
      }
      await prisma.$transaction(async (tx) => {
        const latest = await tx.product.findUniqueOrThrow({ where: { id: current.id } });
        assert.equal(latest.updatedAt.toISOString(), product.updatedAt, "Product changed during example refresh");
        await tx.product.update({ where: { id: current.id }, data: { canonicalData: { ...(latest.canonicalData as object), workbookExample: sample.workbookExample } } });
      }, { isolationLevel: "Serializable" });
      console.log(`${sample.productType}: ${sample.workbookExample.definitionCount} example definitions available; ${Object.keys(product.variants[0].channelAttributes).length} dynamic cells populated per SKU; ${sample.workbookExample.skipped.length} incompatible examples retained as guidance`);
    }
  } finally {
    await fetch(origin + "/api/auth/logout", { method: "POST", headers });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
