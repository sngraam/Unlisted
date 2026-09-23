// Fill the pinned Amazon workbook without round-tripping its native Excel features.
// Only Template's data rows and used-range dimension are changed; other ZIP parts
// (including any VBA, dropdowns, styles and supporting sheets) remain byte-identical.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { unzip, zip, strFromU8, strToU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { isNumericTemplateField, resolvedTemplateValues, templateAnswerIssues } from "../marketplace-template";
import type { MarketplaceTemplate } from "../../types/marketplace-template";
import type { Product, Variant } from "../../types/sku";

export type ExportFormat = "xlsm" | "csv";
export type ExportTemplate = MarketplaceTemplate & { sourceSha256: string };
export class TemplateExportError extends Error {}
const fail = (message: string): never => { throw new TemplateExportError(message); };
// Amazon's shared strings contain thousands of ordinary &amp; entities. DTDs and
// custom entities are rejected below; permit bounded standard-entity decoding.
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, parseAttributeValue: false, trimValues: false, processEntities: { maxTotalExpansions: 1000000, maxExpandedLength: 64000000 } });
const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const parse = (value: Uint8Array) => {
  const xml = strFromU8(value);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) fail("Unsupported template XML.");
  return parser.parse(xml);
};
export const unzipWorkbook = (bytes: Uint8Array) => new Promise<Record<string, Uint8Array>>((resolve, reject) => unzip(bytes, (error, files) => error ? reject(error) : resolve(files)));
export const zipFiles = (files: Record<string, Uint8Array>) => new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 6 }, (error, bytes) => error ? reject(error) : resolve(bytes)));

export async function readTemplateSource(template: ExportTemplate) {
  if (!/^[a-f0-9]{64}$/.test(template.sourceSha256)) fail("Invalid template source checksum.");
  const directory = process.env.AMAZON_TEMPLATE_DIR || join(process.cwd(), "private/amazon-templates");
  let bytes: Buffer;
  try { bytes = await readFile(join(directory, `${template.sourceSha256}.xlsm`)); }
  catch { return fail(`Original ${template.productType} workbook is unavailable. Ask an admin to import its XLSM source.`); }
  if (bytes.length > 16 * 1024 * 1024) fail("Template source exceeds the export size limit.");
  if (createHash("sha256").update(bytes).digest("hex") !== template.sourceSha256)
    fail("Original template checksum changed. Re-import the matching workbook before exporting.");
  return bytes;
}

function columnNumber(address: string) {
  return Array.from(address.match(/^[A-Z]+/)?.[0] || "").reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
}
function columnName(n: number): string {
  let result = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
  return result;
}
// Excel's escaped-character notation needs escaping too, to preserve literal _xNNNN_.
function xmlText(value: string) {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/.test(value)) fail("A listing value contains an unsupported control character.");
  return value.replace(/_x[0-9a-f]{4}_/gi, (v) => `_x005F_${v.slice(1)}`)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#13;");
}
const richText = (value: any): string => {
  const text = (v: any) => typeof v === "object" ? String(v?.["#text"] ?? "") : String(v ?? "");
  return value?.r ? array<any>(value.r).map((run) => text(run.t)).join("") : text(value?.t);
};

// Same reviewed core/dynamic merge used by the editor. Amazon's browse selector
// expects the workbook's path (ID) choice, not the raw ID stored in the database.
export function amazonRow(product: Product, variant: Variant, template: MarketplaceTemplate): string[] {
  const values = resolvedTemplateValues(product, variant, template);
  const known = new Set(template.fields.map((field) => field.key));
  if (Object.keys(variant.channelAttributes || {}).some((key) => !known.has(key)))
    fail(`SKU ${variant.sku} contains attributes outside its selected template.`);
  if (product.productType !== template.productType || product.templateId !== template.id)
    fail("Listing category does not match its pinned template.");
  const issue = templateAnswerIssues(template, values)[0];
  if (issue) fail(`${variant.sku} — ${issue.label}: ${issue.message}`);
  return template.fields.map((field) => {
    let value = values[field.key];
    if (field.attribute === "recommended_browse_nodes" && value) {
      value = field.allowedValues?.find((choice) => choice === value || choice.endsWith(`(${value})`)) || value;
    }
    if (value.length > 32767) fail(`SKU ${variant.sku}: ${field.label} exceeds Excel's cell limit.`);
    return value;
  });
}

export async function fillAmazonTemplate(source: Uint8Array, template: ExportTemplate, rows: string[][], format: ExportFormat) {
  if (!rows.length || rows.length > 1000) fail("Export between 1 and 1,000 SKU rows at a time.");
  if (createHash("sha256").update(source).digest("hex") !== template.sourceSha256) fail("Template source checksum mismatch.");
  const files = await unzipWorkbook(source);
  const workbook = parse(files["xl/workbook.xml"]).workbook;
  const sheet = array<any>(workbook.sheets.sheet).find((s) => s["@_name"] === "Template");
  const relation = array<any>(parse(files["xl/_rels/workbook.xml.rels"]).Relationships.Relationship)
    .find((r) => r["@_Id"] === sheet?.["@_r:id"] && !r["@_TargetMode"]);
  if (!relation) fail("The source workbook has no Template worksheet.");
  const target = String(relation["@_Target"]);
  const sheetPath = target.startsWith("/") ? target.slice(1) : posix.normalize(posix.join("xl", target));
  if (!files[sheetPath]) fail("Template worksheet is missing from the source workbook.");
  const original = strFromU8(files[sheetPath]);
  const worksheet = parse(files[sheetPath]).worksheet;
  const strings = files["xl/sharedStrings.xml"] ? array<any>(parse(files["xl/sharedStrings.xml"]).sst.si).map(richText) : [];
  const cellText = (cell: any): string => cell["@_t"] === "s" ? strings[Number(cell.v)] ?? "" : cell["@_t"] === "inlineStr" ? richText(cell.is) : String(cell.v ?? "");
  const sourceRows = array<any>(worksheet.sheetData.row);
  const settings = cellText(array<any>(sourceRows.find((r) => r["@_r"] === "1")?.c).find((c) => c["@_r"] === "A1") || {});
  const dataRow = Number(settings.match(/(?:^|&)dataRow=(\d+)/)?.[1]);
  const attributeRow = Number(settings.match(/(?:^|&)attributeRow=(\d+)/)?.[1]);
  if (dataRow !== 7 || attributeRow !== 5) fail("This workbook layout needs a compatible template importer.");
  const width = template.fields.length;
  const headers = Array<string>(width).fill("");
  for (const cell of array<any>(sourceRows.find((r) => Number(r["@_r"]) === attributeRow)?.c)) headers[columnNumber(cell["@_r"]) - 1] = cellText(cell);
  if (headers.length !== width || template.fields.some((field, index) => field.column !== index + 1 || headers[index] !== field.key))
    fail("Original workbook columns do not match the saved template version.");
  if (sourceRows.some((row) => Number(row["@_r"]) >= dataRow && array<any>(row.c).some((cell) => cellText(cell) !== "" || cell.f !== undefined)))
    fail("Import a blank category template. Its data area already contains listing values.");
  if (rows.some((row) => row.length !== width)) fail("Listing row does not match the template columns.");
  for (const row of rows) {
    const issue = templateAnswerIssues(template, Object.fromEntries(template.fields.map((field, i) => [field.key, row[i]])))[0];
    if (issue) fail(`${row[0]} — ${issue.label}: ${issue.message}`);
  }
  const columnStyles = Array<string | undefined>(width);
  for (const column of array<any>(worksheet.cols?.col)) {
    if (!/^\d+$/.test(column["@_style"] || "")) continue;
    for (let c = Math.max(1, Number(column["@_min"])); c <= Math.min(width, Number(column["@_max"])); c++) columnStyles[c - 1] = column["@_style"];
  }

  if (format === "csv") {
    const headerRows = Array.from({ length: dataRow - 1 }, (_, i) => {
      const row = Array<string>(width).fill("");
      for (const cell of array<any>(sourceRows.find((r) => Number(r["@_r"]) === i + 1)?.c)) row[columnNumber(cell["@_r"]) - 1] = cellText(cell);
      return row;
    });
    // CSV cannot safely preserve leading formula-like text as literal Excel text.
    // Use XLSM in this case instead of changing the seller's value with apostrophes.
    for (const row of rows) for (const value of row) {
      if (/^\s*[=+@-]/.test(value) || /^[\t\r]/.test(value)) fail("A value starts with a spreadsheet formula character. Choose XLSM to preserve it safely.");
      xmlText(value);
    }
    return strToU8("\uFEFF" + [...headerRows, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n");
  }
  const data = rows.map((values, i) => {
    const row = dataRow + i;
    // Measurements are numeric cells. Identifiers (including HSN) remain literal
    // strings to preserve leading zeros and never execute seller text as formulas.
    return `<row r="${row}">${values.map((value, c) => {
      if (value === "") return "";
      const ref = `r="${columnName(c + 1)}${row}"${columnStyles[c] ? ` s="${columnStyles[c]}"` : ""}`;
      return isNumericTemplateField(template.fields[c])
        ? `<c ${ref} t="n"><v>${value.trim()}</v></c>`
        : `<c ${ref} t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
    }).join("")}</row>`;
  }).join("");
  // Retain rows 1–6 verbatim, including the frozen example row. Remove only blank
  // data rows from a clean template before inserting this export's SKU rows.
  const sheetData = original.match(/<sheetData(?:\s[^>]*)?>([\s\S]*?)<\/sheetData>/);
  if (!sheetData) fail("Unsupported Template worksheet data layout.");
  const retained = sheetData![1].replace(/<row\b[^>]*\br="(\d+)"[^>]*(?:\/>|>[\s\S]*?<\/row>)/g, (xml, r) => Number(r) >= dataRow ? "" : xml);
  const updated = original.replace(sheetData![0], `<sheetData>${retained}${data}</sheetData>`)
    .replace(/<dimension\b[^>]*\/>/, `<dimension ref="A1:${columnName(width)}${dataRow + rows.length - 1}" />`);
  files[sheetPath] = strToU8(updated);
  return zipFiles(files);
}
