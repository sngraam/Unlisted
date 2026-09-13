// Dependency-free CSV parsing/export for the demo. Handles quotes, commas, BOMs and CRLF.
// Export is a review CSV, not an official Amazon/Flipkart category template.
import { Product } from "@/types/sku";
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted)
    throw new Error(
      "A quoted field is not closed. Check your CSV and try again.",
    );
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function downloadText(
  text: string,
  filename: string,
  type = "text/csv;charset=utf-8;",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportProducts(products: Product[]) {
  const headers = [
    "seller_sku_id",
    "product_title",
    "brand",
    "marketplace",
    "color",
    "size",
    "mrp_inr",
    "selling_price_inr",
    "stock",
    "description",
    "key_features",
    "search_keywords",
  ];
  const rows = products.flatMap((p) =>
    p.variants.map((v) => [
      v.sku,
      p.title,
      p.brand,
      p.marketplace,
      v.color,
      v.size,
      v.mrp,
      v.price,
      v.stock,
      p.description,
      p.bullets.join(" | "),
      p.keywords,
    ]),
  );
  downloadText(
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n"),
    "listing-review-export.csv",
  );
}
