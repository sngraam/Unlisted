// Targeted, idempotent repair of the three reported example-value errors.
// Never reset a product or replace a user's later values. Save through the API
// so old revisions remain intact and affected approvals are revoked normally.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
config({ path: ".env.local" });
const database = new URL(process.env.DATABASE_URL || "");
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "5433");
assert.equal(database.pathname, "/listing_agent_local");
assert.ok(process.argv.includes("--apply"), "Use --apply to repair known local examples.");
const origin = "http://localhost:3000";
const seed = JSON.parse(readFileSync("../test/seed-data.json", "utf8"));
function stableId(key: string) {
  const h = createHash("sha256").update("listing-agent-local:" + key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function main() {
  const login = await fetch(origin + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ identifier: seed.profile.username, password: "sngram" }) });
  assert.equal(login.status, 200);
  const headers = { "Content-Type": "application/json", Origin: origin, Cookie: login.headers.get("set-cookie")!.split(";")[0] };
  try {
    const response = await fetch(origin + "/api/workspace", { headers });
    assert.equal(response.status, 200);
    const state = await response.json();
    const updates = [];
    for (const fixture of seed.products) {
      const product = state.products.find((p: any) => p.id === stableId("product:" + fixture.id));
      assert.ok(product?.workbookExample && product.name.includes("Sample") && product.productType === fixture.productType, "Refusing to alter an unrelated or real product.");
      let changes = 0;
      const variants = product.variants.map((v: any) => {
        assert.ok(v.sku.startsWith(`DEMO-${fixture.productType}-`));
        const answers = { ...v.channelAttributes };
        for (const [key, value] of Object.entries(answers)) {
          if (/^rise\[.*\.height#\d+\.value$/.test(key) && value === "5, 4") { answers[key] = "5"; changes++; }
          if (key.startsWith("external_product_information[") && key.endsWith(".value") && value === "QUJ85, 610510, 61051010" && answers[key.replace(/\.value$/, ".entity")] === "HSN Code") { answers[key] = "610510"; changes++; }
          if (key.startsWith("regulatory_compliance_certification[") && key.endsWith(".value") && value === "1AB1331-121A" && !answers[key.replace(/\.value$/, ".regulation_type")]?.trim()) { delete answers[key]; changes++; }
        }
        return { ...v, channelAttributes: answers };
      });
      if (changes) updates.push({ before: product, input: { ...product, variants }, changes });
    }
    if (!updates.length) { console.log("All known sample values already repaired; later edits preserved."); return; }
    const backup = `/tmp/listing-field-repair-${Date.now()}.json`;
    writeFileSync(backup, JSON.stringify(updates.map((u) => u.before), null, 2), { flag: "wx", mode: 0o600 });
    console.log(`Private backup: ${backup}`);
    for (const { input, changes } of updates) {
      const saved = await fetch(origin + `/api/products/${input.id}`, { method: "PUT", headers, body: JSON.stringify(input) });
      const body = await saved.json();
      assert.equal(saved.status, 200, JSON.stringify(body));
      const product = body.products.find((p: any) => p.id === input.id);
      assert.equal(product.approved, false);
      for (const variant of product.variants) assert.deepEqual(variant.channelAttributes, input.variants.find((v: any) => v.id === variant.id).channelAttributes);
      console.log(`${product.productType}: ${changes} example cells repaired; new revision needs review.`);
    }
  } finally { await fetch(origin + "/api/auth/logout", { method: "POST", headers }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
