// Shared, deterministic mapping between a saved product and one imported XLSM version.
// This is a completeness preview, not Amazon's live product-type validation.
import type { Product, Variant } from "@/types/sku";
import type { MarketplaceTemplate, MarketplaceTemplateField } from "@/types/marketplace-template";

export interface TemplateDefinition {
  pattern: string;
  field: MarketplaceTemplateField;
  cells: MarketplaceTemplateField[];
  example?: string;
  sourceRow?: number;
}

// Match Data Definitions' exact normalized keys, never labels or root attributes:
// dimensions, image slots and compliance document types have distinct definitions.
export function templateDefinitions(template: MarketplaceTemplate): TemplateDefinition[] {
  const definitions = new Map<string, TemplateDefinition>();
  const guidance = new Map(template.sourceMetadata?.definitions.map((d) => [d.pattern, d]) || []);
  for (const field of template.fields) {
    const pattern = field.pattern || field.key.replace(/#\d+/g, "#*");
    const existing = definitions.get(pattern);
    if (existing) existing.cells.push(field);
    else definitions.set(pattern, { pattern, field, cells: [field], example: guidance.get(pattern)?.example, sourceRow: guidance.get(pattern)?.row });
  }
  return Array.from(definitions.values());
}

export function hasStrictChoices(template: MarketplaceTemplate, field: MarketplaceTemplateField) {
  return !!field.allowedValues?.length && !template.sourceMetadata?.suggestedChoiceKeys.includes(field.key);
}

export function isManagedTemplateField(field: MarketplaceTemplateField) {
  // A shared scalar fills only its first exact cell. Later repeats remain editable.
  if (field.attribute === "bullet_point") return /#\d+\.value$/.test(field.key);
  if (!/#1\.value$/.test(field.key)) return false;
  return [
    "contribution_sku",
    "product_type",
    "recommended_browse_nodes",
    "item_name",
    "brand",
    "product_description",
    "country_of_origin",
    "color",
  ].includes(field.attribute);
}

export function valueForTemplateField(product: Product, variant: Variant, field: MarketplaceTemplateField) {
  if (!isManagedTemplateField(field)) return variant.channelAttributes?.[field.key]?.trim() || "";
  const index = Number(field.key.match(/#(\d+)/)?.[1] || 1) - 1;
  switch (field.attribute) {
    case "contribution_sku": return variant.sku;
    case "product_type": return product.productType || "";
    case "recommended_browse_nodes": return index === 0 ? product.browseNodeId || "" : "";
    case "item_name": return product.title;
    case "brand": return product.brand;
    case "product_description": return product.description;
    case "bullet_point": return product.bullets[index] || "";
    case "country_of_origin": return variant.countryOfOrigin ?? product.origin;
    case "color": return field.key.endsWith(".value") ? variant.color : "";
    default: return "";
  }
}

// Explicit rules supported by the imported definitions and observed submission
// errors. Keep these independent of labels and never infer a product's facts.
export function isNumericTemplateField(field: MarketplaceTemplateField) {
  return field.attribute === "rise" && /\.height#\d+\.value$/.test(field.key);
}

export interface TemplateAnswerIssue {
  key: string;
  label: string;
  kind: "missing" | "invalid";
  message: string;
}

export interface TemplateFieldFocus {
  variantId: string;
  key: string;
}

// Keep dependent values in the same repeat slot visible when fixing an issue.
export function relatedTemplateFieldKeys(template: MarketplaceTemplate, key: string) {
  const field = template.fields.find((item) => item.key === key);
  if (!field) return [];
  const suffix = field.attribute === "regulatory_compliance_certification" ? /\.(?:regulation_type|value)$/
    : field.attribute === "external_product_information" ? /\.(?:entity|value)$/ : null;
  return suffix ? template.fields.filter((item) => item.attribute === field.attribute && item.key.replace(suffix, "") === key.replace(suffix, "")).map((item) => item.key) : [key];
}

export function templateFieldSearchText(definition: TemplateDefinition) {
  return [definition.field.label, definition.field.group, definition.pattern, definition.field.description,
    ...definition.cells.flatMap((cell) => cell.allowedValues || [])].join(" ").toLowerCase();
}

export function templateFieldDestination(field: MarketplaceTemplateField, variantId: string) {
  if (!isManagedTemplateField(field)) return { section: "Amazon attributes", controlId: "" };
  const variantKey = { contribution_sku: "sku", color: "color", country_of_origin: "countryOfOrigin" }[field.attribute];
  if (variantKey) return { section: "Variants & pricing", controlId: `variant-${variantId}-${variantKey}` };
  if (field.attribute === "brand") return { section: "Product details", controlId: "product-brand" };
  const copyId = { item_name: "listing-title", product_description: "listing-description", bullet_point: `listing-bullet-${Number(field.key.match(/#(\d+)/)?.[1] || 1) - 1}` }[field.attribute];
  return copyId ? { section: "Listing content", controlId: copyId } : { section: "Amazon attributes", controlId: "" };
}

export function templateAnswerIssues(template: MarketplaceTemplate, answers: Record<string, string>): TemplateAnswerIssue[] {
  const issues: TemplateAnswerIssue[] = [];
  const fields = new Map(template.fields.map((field) => [field.key, field]));
  const value = (key: string) => answers[key]?.trim() || "";
  const add = (field: MarketplaceTemplateField, kind: TemplateAnswerIssue["kind"], message: string) => issues.push({ key: field.key, label: field.label, kind, message });
  for (const field of template.fields) {
    const current = value(field.key);
    if (isNumericTemplateField(field) && current && (!/^\d+(?:\.\d+)?$/.test(current) || !Number.isFinite(Number(current))))
      add(field, "invalid", "Enter one nonnegative number, such as 5 or 5.25. Keep units in Rise Height Unit; do not enter an example list.");
    if (field.attribute === "external_product_information" && field.key.endsWith(".value")) {
      const entity = fields.get(field.key.replace(/\.value$/, ".entity"));
      if (!entity) continue;
      const entityValue = value(entity.key);
      if (current && !entityValue) add(entity, "missing", "Choose the entity for this external product information value.");
      if (entityValue && !current) add(field, "missing", "Enter one value for the selected external product information entity.");
      if (current && template.marketplaceId === "A21TJRUUN4KGV" && ["HSN Code", "HSN"].includes(entityValue) && !/^\d{6,8}$/.test(current))
        add(field, "invalid", "For HSN Code, enter one 6–8-digit code. The workbook's comma-separated examples are alternatives, not one value.");
    }
    if (field.attribute === "regulatory_compliance_certification" && field.key.endsWith(".value")) {
      // Match the exact repeat index. A type in slot 1 cannot satisfy an ID in slot 2.
      const type = fields.get(field.key.replace(/\.value$/, ".regulation_type"));
      if (!type) continue;
      const typeValue = value(type.key);
      if (current && !typeValue) add(type, "missing", "Required when Regulatory Identification is entered in this slot. Select the applicable type, or clear the ID if it does not apply.");
      if (typeValue && !current) add(field, "missing", "Enter the verified regulatory ID for this compliance type, or clear the type if it does not apply.");
    }
  }
  return issues;
}

export function templateGaps(product: Product, template: MarketplaceTemplate) {
  const missing: Array<{ variantId: string; sku: string; label: string; key: string; message: string }> = [];
  const invalid: typeof missing = [];
  for (const variant of product.variants) {
    for (const definition of templateDefinitions(template)) {
      if (definition.field.requirement === "REQUIRED" && !definition.cells.some((cell) => valueForTemplateField(product, variant, cell).trim()))
        missing.push({ variantId: variant.id, sku: variant.sku, label: definition.field.label, key: definition.cells[0].key, message: "Enter a value for this required field." });
    }
    for (const field of template.fields) {
      const value = valueForTemplateField(product, variant, field).trim();
      const browseNodeMatches = field.attribute === "recommended_browse_nodes" &&
        field.allowedValues?.some((choice) => choice.endsWith(`(${value})`));
      if (value && hasStrictChoices(template, field) && !field.allowedValues!.includes(value) && !browseNodeMatches)
        invalid.push({ variantId: variant.id, sku: variant.sku, label: field.label, key: field.key, message: "Choose a value allowed by this category template." });
    }
    for (const issue of templateAnswerIssues(template, resolvedTemplateValues(product, variant, template))) {
      const target = issue.kind === "missing" ? missing : invalid;
      if (!target.some((gap) => gap.variantId === variant.id && gap.key === issue.key))
        target.push({ variantId: variant.id, sku: variant.sku, key: issue.key, label: issue.label, message: issue.message });
    }
  }
  return { missing, invalid };
}

// One merge contract for field review and adapters. Never overlay typed facts with JSON.
export function resolvedTemplateValues(product: Product, variant: Variant, template: MarketplaceTemplate) {
  return Object.fromEntries(template.fields.map((field) => [field.key, valueForTemplateField(product, variant, field)]));
}
