// Focused regression checks for file parsing, export safety, and approval-blocking review rules.
// TypeScript type checking is handled separately by the production build.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
function loadTs(relative) {
  const filename = path.resolve(__dirname, "..", relative);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(source, filename);
  return loaded.exports;
}
const { parseCsv, csvCell, exportProducts } = loadTs("lib/csv.ts");
const { auditListing, auditScore } = loadTs("lib/validation.ts");
const { products: initialProducts } = require("../../test/seed-data.json");

test("CSV preserves quoted commas, embedded newlines, and escaped quotes", () => {
  assert.deepEqual(
    parseCsv('sku,name,notes\r\nA,"Kurta, blue","Line one\nLine ""two"""\r\n'),
    [
      ["sku", "name", "notes"],
      ["A", "Kurta, blue", 'Line one\nLine "two"'],
    ],
  );
});
test("CSV tolerates a BOM and ignores blank rows", () => {
  assert.deepEqual(parseCsv("\uFEFFsku,name\n\nA,Kurta\n"), [
    ["sku", "name"],
    ["A", "Kurta"],
  ]);
});
test("CSV rejects an unterminated quoted field", () => {
  assert.throws(() => parseCsv('sku,name\nA,"Unclosed'), /not closed/);
});
test("CSV export preserves Unicode and escapes spreadsheet formulas", () => {
  assert.equal(csvCell('Cotton "Blue" ₹'), '"Cotton ""Blue"" ₹"');
  for (const value of ["=SUM(1,2)", "+1+1", "-1+1", "@SUM(A1)", "\t=1"]) {
    assert.ok(csvCell(value).startsWith("\"'"));
  }
});
test("Valid seed product passes all prototype review checks", () => {
  const checks = auditListing(initialProducts[0], "miracle, cure");
  assert.equal(auditScore(checks), 100);
});
test("Banned terms block approval even when they appear in keywords", () => {
  const product = { ...initialProducts[0], keywords: "cotton, miracle, blue" };
  const check = auditListing(product, "miracle").find(
    (c) => c.title === "Banned words & claims",
  );
  assert.equal(check.passed, false);
  assert.equal(check.severity, "error");
});
test("Pricing mistakes and duplicate variant SKUs block approval", () => {
  const variant = initialProducts[0].variants[0];
  for (const variants of [
    [{ ...variant, price: variant.mrp + 1 }],
    [variant, { ...variant, id: "second" }],
    [{ ...variant, stock: 1.5 }],
  ]) {
    const result = auditListing({ ...initialProducts[0], variants }, "");
    assert.equal(
      result.find((c) => c.title === "Variant pricing & inventory").passed,
      false,
    );
  }
});
test("Missing brand/title and bullet content block approval", () => {
  const checks = auditListing(
    { ...initialProducts[0], title: "Unbranded", bullets: [] },
    "",
  );
  assert.equal(
    checks.filter((c) => !c.passed && c.severity === "error").length,
    3,
  );
});
test("Export creates one row per variant without changing publication status", async () => {
  let blob;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalDocument = global.document;
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:test";
  };
  URL.revokeObjectURL = () => {};
  global.document = { createElement: () => ({ click() {} }) };
  try {
    const p = {
      ...initialProducts[0],
      variants: [
        initialProducts[0].variants[0],
        { ...initialProducts[0].variants[0], sku: "SECOND", id: "second" },
      ],
    };
    const before = JSON.stringify(p);
    exportProducts([p]);
    const rows = parseCsv(await blob.text());
    assert.equal(rows.length, 3);
    assert.equal(rows[2][0], "SECOND");
    assert.equal(JSON.stringify(p), before);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    global.document = originalDocument;
  }
});
