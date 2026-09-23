import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { strFromU8, strToU8 } from "fflate";
import { amazonRow, fillAmazonTemplate, unzipWorkbook, zipFiles, type ExportTemplate } from "../lib/server/amazon-export";
import { parseCsv } from "../lib/csv";
import type { Product } from "../types/sku";

async function main() {
const root = "../test/amazon-templates";
const fixtures: { products: Product[] } = JSON.parse(await readFile("../test/seed-data.json", "utf8"));
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: false, processEntities: { maxTotalExpansions: 1000000, maxExpandedLength: 64000000 } });
const text = (c: any) => c["@_t"] === "n" ? String(c.v) : typeof c.is?.t === "object" ? c.is.t["#text"] : c.is?.t;

for (const name of await readdir(`${root}/catalog`)) {
  if (!name.endsWith(".json")) continue;
  const template: ExportTemplate = { ...JSON.parse(await readFile(`${root}/catalog/${name}`, "utf8")), id: "pinned" };
  const product = { ...fixtures.products.find((p) => p.productType === template.productType)!, templateId: template.id };
  const source = await readFile(`${root}/inbox/${template.productType}.xlsm`);
  test(`${template.productType}: every export column matches approved values; only Template data changes`, async () => {
    const rows = product.variants.map((v) => amazonRow(product, v, template));
    const output = await fillAmazonTemplate(source, template, rows, "xlsm");
    const before = await unzipWorkbook(source), after = await unzipWorkbook(output);
    assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
    for (const part of Object.keys(before)) if (part !== "xl/worksheets/sheet5.xml") assert.deepEqual(after[part], before[part], part);
    const original = strFromU8(before["xl/worksheets/sheet5.xml"]), changed = strFromU8(after["xl/worksheets/sheet5.xml"]);
    const strip = (s: string) => s.replace(/<dimension\b[^>]*\/>/, "").replace(/<row\b[^>]*\br="([7-9]|\d{2,})"[^>]*>[\s\S]*?<\/row>/g, "");
    assert.equal(strip(changed), strip(original), "headers, example row, validations and style references stay unchanged");
    const actual = parser.parse(changed).worksheet.sheetData.row.slice(6);
    assert.equal(actual.length, product.variants.length);
    for (let r = 0; r < rows.length; r++) {
      const cells = new Map(actual[r].c.map((c: any) => [c["@_r"], text(c)]));
      for (let col = 0; col < rows[r].length; col++) {
        let n = col + 1, letters = "";
        while (n) { letters = String.fromCharCode(65 + (n - 1) % 26) + letters; n = Math.floor((n - 1) / 26); }
        assert.equal(cells.get(`${letters}${r + 7}`) || "", rows[r][col], template.fields[col].key);
      }
    }
    assert.equal(rows[0][0], product.variants[0].sku);
    assert.equal(rows[1][1], template.productType);
    const csv = strFromU8(await fillAmazonTemplate(source, template, rows, "csv"));
    const parsed = parseCsv(csv);
    const headerIndex = parsed.findIndex((r) => r[0] === "contribution_sku#1.value");
    assert.deepEqual(parsed[headerIndex], template.fields.map((f) => f.key));
    assert.deepEqual(parsed.slice(headerIndex + 2), rows);
    assert.equal(parsed[headerIndex + 1][0], "ABC123", "source example stays in row 6");
    if (process.env.EXPORT_QA_DIR) {
      await writeFile(`${process.env.EXPORT_QA_DIR}/${template.productType}.xlsm`, output);
      await writeFile(`${process.env.EXPORT_QA_DIR}/${template.productType}.csv`, csv);
    }
  });
}

test("literal values, multiline Unicode, repeat slots and VBA parts survive XLSM export", async () => {
  const template: ExportTemplate = { ...JSON.parse(await readFile(`${root}/catalog/KURTA.3ca57df54e4b.json`, "utf8")), id: "pinned" };
  const files = await unzipWorkbook(await readFile(`${root}/inbox/KURTA.xlsm`));
  files["xl/vbaProject.bin"] = new Uint8Array([0, 42, 255, 10]); // Preservation sentinel; never executed.
  const source = await zipFiles(files);
  template.sourceSha256 = createHash("sha256").update(source).digest("hex");
  const p = { ...fixtures.products[0], templateId: template.id, title: '=literal "shirt" & cotton\nकुर्ता _x0041_', variants: [{ ...fixtures.products[0].variants[0], sku: "0000123" }] };
  const row = amazonRow(p, p.variants[0], template);
  const output = await unzipWorkbook(await fillAmazonTemplate(source, template, [row], "xlsm"));
  assert.deepEqual(output["xl/vbaProject.bin"], files["xl/vbaProject.bin"]);
  const data = parser.parse(strFromU8(output["xl/worksheets/sheet5.xml"])).worksheet.sheetData.row.at(-1).c;
  assert.equal(text(data[0]), "0000123");
  assert.ok(data.every((c: any) => c.f === undefined));
  assert.equal(text(data.find((c: any) => c["@_r"] === "G7")), p.title.replace("_x0041_", "_x005F_x0041_"));
  await assert.rejects(fillAmazonTemplate(source, template, [row], "csv"), /Choose XLSM/);
  const safe = row.map((v) => v === p.title ? 'कुर्ता, "cotton"\nsecond line' : v);
  const csv = parseCsv(strFromU8(await fillAmazonTemplate(source, template, [safe], "csv")));
  assert.deepEqual(csv.at(-1), safe);
  await assert.rejects(fillAmazonTemplate(source, { ...template, sourceSha256: "0".repeat(64) }, [row], "xlsm"), /checksum/);
  await assert.rejects(fillAmazonTemplate(source, { ...template, fields: template.fields.slice(1) }, [row], "xlsm"), /columns/);
  assert.throws(() => amazonRow({ ...p, productType: "PANTS" }, p.variants[0], template), /category/);
  assert.throws(() => amazonRow(p, { ...p.variants[0], channelAttributes: { stranger: "x" } }, template), /outside/);
  files["xl/worksheets/sheet5.xml"] = strToU8(strFromU8(files["xl/worksheets/sheet5.xml"]).replace("</sheetData>", '<row r="7"><c r="A7" t="inlineStr"><is><t>PRIVATE-OLD-SKU</t></is></c></row></sheetData>'));
  const dirty = await zipFiles(files);
  await assert.rejects(fillAmazonTemplate(dirty, { ...template, sourceSha256: createHash("sha256").update(dirty).digest("hex") }, [row], "xlsm"), /blank category template/);
});

test("reported bad examples cannot export; rise is a numeric cell and HSN stays text", async () => {
  const t: ExportTemplate = { ...JSON.parse(await readFile(`${root}/catalog/PANTS.de2f2a66a902.json`, "utf8")), id: "pinned" };
  const p = { ...fixtures.products.find((item) => item.productType === "PANTS")!, templateId: t.id };
  const source = await readFile(`${root}/inbox/PANTS.xlsm`);
  const rise = t.fields.find((f) => f.label === "Rise Height")!;
  const hsn = t.fields.find((f) => f.label === "External Product Information")!;
  const regulation = t.fields.find((f) => f.label === "Regulatory Identification")!;
  const variant = { ...p.variants[0], channelAttributes: { ...p.variants[0].channelAttributes, [rise.key]: "5.25", [hsn.key]: "001234" } };
  const row = amazonRow(p, variant, t);
  const archive = await unzipWorkbook(await fillAmazonTemplate(source, t, [row], "xlsm"));
  const cells = parser.parse(strFromU8(archive["xl/worksheets/sheet5.xml"])).worksheet.sheetData.row.at(-1).c;
  assert.ok(cells.some((c: any) => c["@_t"] === "n" && c.v === "5.25"));
  assert.ok(cells.some((c: any) => c["@_t"] === "inlineStr" && text(c) === "001234"));
  for (const [field, value] of [[rise, "5, 4"], [hsn, "QUJ85, 610510, 61051010"], [regulation, "1AB1331-121A"]] as const) {
    assert.throws(() => amazonRow(p, { ...variant, channelAttributes: { ...variant.channelAttributes, [field.key]: value } }, t));
    const bad = [...row]; bad[field.column - 1] = value;
    await assert.rejects(fillAmazonTemplate(source, t, [bad], "csv"));
    await assert.rejects(fillAmazonTemplate(source, t, [bad], "xlsm"));
  }
});
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
