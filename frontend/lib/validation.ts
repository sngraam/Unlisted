// Prototype review rules, not official marketplace compliance certification.
// Keep these separate from UI so backend validation can replace them later.
import { Product } from "@/types/sku";
export interface AuditCheck {
  title: string;
  detail: string;
  passed: boolean;
  severity: "error" | "warning";
}
export function auditListing(
  product: Product,
  bannedTerms: string,
): AuditCheck[] {
  const banned = bannedTerms
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const text = [
    product.title,
    product.description,
    ...product.bullets,
    product.keywords,
  ]
    .join(" ")
    .toLowerCase();
  const found = banned.filter((term) => text.includes(term));
  return [
    {
      title: "Product title",
      detail:
        product.title.length +
        " / 200 characters. Use a clear, descriptive title.",
      passed: product.title.trim().length >= 20 && product.title.length <= 200,
      severity: "error",
    },
    {
      title: "Brand name confirmation",
      detail: "The title should begin with “" + product.brand + "”.",
      passed:
        !!product.brand &&
        product.title.toLowerCase().startsWith(product.brand.toLowerCase()),
      severity: "error",
    },
    {
      title: "Key bullet points",
      detail: "Add five useful, nonempty product benefits.",
      passed:
        product.bullets.length === 5 &&
        product.bullets.every((b) => b.trim().length >= 10),
      severity: "error",
    },
    {
      title: "Description length",
      detail: "Aim for at least 300 characters of verified product detail.",
      passed: product.description.trim().length >= 300,
      severity: "warning",
    },
    {
      title: "Search keywords",
      detail: "Add at least three relevant comma-separated keywords.",
      passed: product.keywords.split(",").filter((k) => k.trim()).length >= 3,
      severity: "warning",
    },
    {
      title: "Banned words & claims",
      detail: found.length
        ? "Remove: " + found.join(", ")
        : "No configured banned terms detected.",
      passed: !found.length,
      severity: "error",
    },
    {
      title: "Variant pricing & inventory",
      detail:
        "Unique SKUs, nonnegative stock, and selling price no higher than MRP.",
      passed:
        product.variants.length > 0 &&
        new Set(product.variants.map((v) => v.sku.trim().toLowerCase()))
          .size === product.variants.length &&
        product.variants.every(
          (v) =>
            v.sku.trim() &&
            Number.isFinite(v.price) &&
            v.price >= 0 &&
            v.mrp >= v.price &&
            Number.isInteger(v.stock) &&
            v.stock >= 0,
        ),
      severity: "error",
    },
  ];
}
export function auditScore(checks: AuditCheck[]) {
  return Math.round(
    (checks.filter((c) => c.passed).length / checks.length) * 100,
  );
}
