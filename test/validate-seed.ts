// Fast dataset check that does not need a running database.
import { readFileSync, readdirSync } from "node:fs";
import { seedDataSchema } from "./seed-contract";

const data = seedDataSchema.parse(
  JSON.parse(readFileSync("../test/seed-data.json", "utf8")),
);
const catalogs = new Map(
  readdirSync("../test/amazon-templates/catalog")
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const template = JSON.parse(readFileSync(`../test/amazon-templates/catalog/${name}`, "utf8"));
      return [template.productType, template] as const;
    }),
);
for (const product of data.products) {
  if (product.marketplace !== "Amazon") continue;
  const template = catalogs.get(product.productType || "");
  if (!template || template.schemaSha256 !== product.templateSha256)
    throw new Error(`${product.name}: template version does not match the checked-in catalog`);
  if (!template.browseNodes.some((node: { id: string }) => node.id === product.browseNodeId))
    throw new Error(`${product.name}: browse node is not in this product type`);
  const fields = new Map<string, { allowedValues?: string[] }>(template.fields.map((field: { key: string; allowedValues?: string[] }) => [field.key, field]));
  for (const variant of product.variants)
    for (const [key, value] of Object.entries(variant.channelAttributes || {})) {
      const field = fields.get(key);
      if (!field || (field.allowedValues?.length && !template.sourceMetadata?.suggestedChoiceKeys.includes(key) && !field.allowedValues.includes(value)))
        throw new Error(`${variant.sku}: invalid ${key}=${value}`);
    }
}
console.log(
  `PASS: dataset has ${data.products.length} products, ${data.products.reduce((sum, item) => sum + item.variants.length, 0)} variants and every Amazon value matches its XLSM catalog.`,
);
