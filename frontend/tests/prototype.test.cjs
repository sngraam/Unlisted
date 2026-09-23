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
const { parseCsv, csvCell } = loadTs("lib/csv.ts");
const { auditListing, auditScore } = loadTs("lib/validation.ts");
const { isManagedTemplateField, valueForTemplateField, templateGaps, templateDefinitions, hasStrictChoices, resolvedTemplateValues, templateAnswerIssues, isNumericTemplateField, relatedTemplateFieldKeys, templateFieldSearchText, templateFieldDestination } = loadTs("lib/marketplace-template.ts");
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
test("Template-backed seed product has no blocking prototype copy checks", () => {
  const checks = auditListing({ ...initialProducts[0], templateId: "pinned-test-template" }, "miracle, cure");
  assert.equal(checks.filter((check) => !check.passed && check.severity === "error").length, 0);
  assert.ok(checks.filter((check) => !check.passed).every((check) => check.severity === "warning"));
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
test("core values cannot be overwritten by JSON and repeated cells remain independent", () => {
  const p = initialProducts[0], v = p.variants[0];
  const first = { key: "brand#1.value", attribute: "brand" };
  assert.equal(valueForTemplateField(p, { ...v, channelAttributes: { "brand#1.value": "Injected" } }, first), p.brand);
  const second = { key: "recommended_browse_nodes#2.value", attribute: "recommended_browse_nodes" };
  assert.equal(isManagedTemplateField(second), false);
  assert.equal(valueForTemplateField(p, { ...v, channelAttributes: { [second.key]: "Second category" } }, second), "Second category");
  assert.equal(valueForTemplateField(p, { ...v, countryOfOrigin: "Japan" }, { key: "country_of_origin#1.value", attribute: "country_of_origin" }), "Japan");
});

test("all four templates validate required dynamic values per SKU, including SHORTS rules", () => {
  const dir = path.resolve(__dirname, "../../test/amazon-templates/catalog");
  for (const file of fs.readdirSync(dir).filter((file) => file.endsWith(".json"))) {
    const template = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const sample = initialProducts.find((p) => p.productType === template.productType);
    if (!sample) continue; // Importing another category does not require inventing a demo product.
    const p = { ...sample, templateId: "test" };
    const fabric = template.fields.find((field) => field.attribute === "fabric_type");
    assert.equal(isManagedTemplateField(fabric), false, "Apparel fabric is not universal product identity");
    const variants = p.variants.map((v, index) => ({ ...v, channelAttributes: { ...v.channelAttributes, ...(index === 0 ? { [fabric.key]: "" } : {}) } }));
    const gaps = templateGaps({ ...p, variants }, template);
    assert.ok(gaps.missing.some((gap) => gap.sku === variants[0].sku && gap.key === fabric.key));
    assert.ok(!gaps.missing.some((gap) => gap.sku === variants[1].sku && gap.key === fabric.key));
    const blankVariants = p.variants.map((v) => ({ ...v, channelAttributes: {} }));
    const blankGaps = templateGaps({ ...p, variants: blankVariants }, template);
    if (template.productType === "SHORTS") assert.ok(blankGaps.missing.some((gap) => gap.key.startsWith("supplier_declared_dg_hz_regulation")));
  }
});

test("Data Definitions grouping preserves every exact export cell without merging distinct definitions", () => {
  const counts = { KURTA: 186, PANTS: 197, SHIRT: 190, SHORTS: 217 };
  const dir = path.resolve(__dirname, "../../test/amazon-templates/catalog");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const template = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const definitions = templateDefinitions(template);
    if (counts[template.productType]) assert.equal(definitions.length, counts[template.productType]);
    assert.equal(definitions.length, template.sourceMetadata.definitions.length);
    assert.deepEqual(new Set(definitions.flatMap((d) => d.cells.map((f) => f.key))), new Set(template.fields.map((f) => f.key)));
    assert.ok(definitions.every((d) => d.example && d.sourceRow >= 4));
    assert.equal(definitions.filter((d) => d.field.attribute === "material").length, 1);
    assert.ok(definitions.filter((d) => d.field.attribute === "compliance_media").length > 1);
    const sample = initialProducts.find((p) => p.productType === template.productType);
    if (!sample) continue;
    const cells = definitions.find((d) => d.field.attribute === "material").cells;
    const variant = { ...sample.variants[0], channelAttributes: { [cells[0].key]: "Cotton", [cells[1].key]: "Nylon" } };
    const row = resolvedTemplateValues(sample, variant, template);
    assert.equal(row[cells[0].key], "Cotton");
    assert.equal(row[cells[1].key], "Nylon");
  }
});

test("Workbook suggestion lists allow numeric prices while closed enums remain enforced", () => {
  const template = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/KURTA.3ca57df54e4b.json"), "utf8"));
  const price = template.fields.find((f) => f.attribute === "purchasable_offer" && f.key.endsWith(".value_with_tax"));
  const idType = template.fields.find((f) => f.attribute === "amzn1.volt.ca.product_id_type");
  assert.equal(hasStrictChoices(template, price), false);
  assert.equal(hasStrictChoices(template, idType), true);
  const sample = initialProducts.find((p) => p.productType === "KURTA");
  const gaps = templateGaps({ ...sample, variants: [{ ...sample.variants[0], channelAttributes: { [price.key]: "259.99", [idType.key]: "INVALID" } }] }, template);
  assert.ok(!gaps.invalid.some((g) => g.key === price.key));
  assert.ok(gaps.invalid.some((g) => g.key === idType.key));
});

test("required definitions do not turn every optional repeat slot into a mandatory answer", () => {
  const template = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/SHORTS.3171ce3ebae7.json"), "utf8"));
  const sample = initialProducts.find((p) => p.productType === "SHORTS");
  const cells = template.fields.filter((f) => f.attribute === "supplier_declared_dg_hz_regulation");
  const product = { ...sample, bullets: ["One example bullet"], variants: [{ ...sample.variants[0], channelAttributes: { [cells[0].key]: cells[0].allowedValues[0] } }] };
  const gaps = templateGaps(product, template);
  assert.ok(!gaps.missing.some((g) => g.key.startsWith("bullet_point") || g.key.startsWith("supplier_declared_dg_hz_regulation")));
  const blank = templateGaps({ ...product, bullets: [], variants: [{ ...product.variants[0], channelAttributes: {} }] }, template);
  assert.equal(blank.missing.filter((g) => g.key.startsWith("bullet_point")).length, 1);
  assert.equal(blank.missing.filter((g) => g.key.startsWith("supplier_declared_dg_hz_regulation")).length, 1);
});

test("rise height accepts one decimal, not a comma-separated example or unit", () => {
  const t = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/PANTS.de2f2a66a902.json"), "utf8"));
  const f = t.fields.find(isNumericTemplateField);
  for (const value of ["5, 4", "5 cm", "1e3", "-2", "Infinity"]) assert.ok(templateAnswerIssues(t, { [f.key]: value }).some((e) => e.key === f.key && e.kind === "invalid"));
  for (const value of ["", "0", "5", "5.25"]) assert.deepEqual(templateAnswerIssues(t, { [f.key]: value }), []);
});

test("HSN validates one code for the selected entity and preserves leading zeros", () => {
  const t = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/KURTA.3ca57df54e4b.json"), "utf8"));
  const entity = t.fields.find((f) => f.attribute === "external_product_information" && f.key.endsWith(".entity"));
  const key = entity.key.replace(/\.entity$/, ".value");
  for (const value of ["QUJ85, 610510, 61051010", "QUJ85", "6105", "610510 61051010"]) assert.ok(templateAnswerIssues(t, { [entity.key]: "HSN Code", [key]: value }).some((e) => e.key === key && e.kind === "invalid"));
  for (const value of ["610510", "61051010", "001234"]) assert.deepEqual(templateAnswerIssues(t, { [entity.key]: "HSN Code", [key]: value }), []);
  assert.equal(templateAnswerIssues(t, { [key]: "610510" })[0].key, entity.key);
  assert.equal(templateAnswerIssues(t, { [entity.key]: "HSN Code" })[0].key, key);
});

test("compliance dependencies pair the same repeat index and do not invent a required certification", () => {
  const t = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/PANTS.de2f2a66a902.json"), "utf8"));
  const types = t.fields.filter((f) => f.attribute === "regulatory_compliance_certification" && f.key.endsWith(".regulation_type"));
  const value = (f) => f.key.replace(/\.regulation_type$/, ".value");
  assert.deepEqual(templateAnswerIssues(t, {}), []);
  assert.deepEqual(templateAnswerIssues(t, { [types[0].key]: "3B Registration Number", [value(types[0])]: "VERIFIED-ID" }), []);
  const crossed = templateAnswerIssues(t, { [types[0].key]: "3B Registration Number", [value(types[1])]: "VERIFIED-ID" });
  assert.deepEqual(new Set(crossed.map((e) => e.key)), new Set([value(types[0]), types[1].key]));
  const sample = initialProducts.find((p) => p.productType === "PANTS");
  const gaps = templateGaps({ ...sample, variants: [{ ...sample.variants[0], channelAttributes: { [value(types[1])]: "VERIFIED-ID" } }] }, t);
  assert.ok(gaps.missing.some((g) => g.key === types[1].key && g.message.includes("Required when")));
});

test("reported KURTA errors identify the second SKU and its exact editable fields", () => {
  const t = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/KURTA.3ca57df54e4b.json"), "utf8"));
  const sample = initialProducts.find((p) => p.productType === "KURTA");
  const hsn = t.fields.find((f) => f.attribute === "external_product_information" && f.key.endsWith(".value"));
  const type = t.fields.find((f) => f.attribute === "regulatory_compliance_certification" && f.key.endsWith(".regulation_type"));
  const variants = sample.variants.map((v, index) => index === 0 ? v : { ...v, channelAttributes: { ...v.channelAttributes, [hsn.key]: "QUJ85, 610510, 61051010", [type.key.replace(/\.regulation_type$/, ".value")]: "1AB1331-121A" } });
  const errors = templateGaps({ ...sample, variants }, t);
  assert.equal(errors.missing.length, 1);
  assert.equal(errors.invalid.length, 1);
  for (const gap of [...errors.missing, ...errors.invalid]) {
    assert.equal(gap.variantId, variants[1].id);
    assert.equal(gap.sku, "DEMO-KURTA-02");
    const destination = templateFieldDestination(t.fields.find((f) => f.key === gap.key), gap.variantId);
    assert.equal(destination.section, "Amazon attributes");
    assert.ok(gap.message);
  }
  const definitions = templateDefinitions(t).filter((d) => templateFieldSearchText(d).includes("hsn"));
  assert.ok(definitions.some((d) => d.cells.some((f) => f.key === hsn.key)), "HSN search must find External Product Information");
});

test("field navigation reveals only the matching compliance repeat pair and routes common fields", () => {
  const t = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../test/amazon-templates/catalog/KURTA.3ca57df54e4b.json"), "utf8"));
  const types = t.fields.filter((f) => f.attribute === "regulatory_compliance_certification" && f.key.endsWith(".regulation_type"));
  const second = types[1];
  assert.deepEqual(new Set(relatedTemplateFieldKeys(t, second.key)), new Set([second.key, second.key.replace(/\.regulation_type$/, ".value")]));
  assert.ok(!relatedTemplateFieldKeys(t, second.key).includes(types[0].key));
  assert.deepEqual(relatedTemplateFieldKeys(t, "unknown"), []);
  for (const [attribute, section, controlId] of [["item_name", "Listing content", "listing-title"], ["brand", "Product details", "product-brand"], ["country_of_origin", "Variants & pricing", "variant-second-countryOfOrigin"]]) {
    const field = t.fields.find((f) => f.attribute === attribute);
    assert.deepEqual(templateFieldDestination(field, "second"), { section, controlId });
  }
});
