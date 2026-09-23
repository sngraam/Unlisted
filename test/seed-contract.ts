// Runtime contract for the synthetic UI dataset. Keep this aligned with frontend/types/sku.ts.
import { z } from "../frontend/node_modules/zod/index.js";

const variant = z.object({
  id: z.string().min(1),
  sku: z.string().trim().min(1).max(100),
  color: z.string().max(120),
  size: z.string().max(120),
  mrp: z.number().nonnegative(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  countryOfOrigin: z.string().max(120).optional(),
  channelAttributes: z.record(z.string(), z.string()).optional(),
}).refine((value) => value.price <= value.mrp, "Variant price must not exceed MRP.");

const product = z.object({
  id: z.string().min(1),
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(500),
  brand: z.string().trim().min(1).max(255),
  category: z.string().max(2000),
  productType: z.string().optional(),
  browseNodeId: z.string().optional(),
  templateSha256: z.string().length(64).optional(),
  marketplace: z.enum(["Amazon", "Flipkart"]),
  status: z.enum(["Draft", "Ready", "Published", "Processing", "Failed"]),
  score: z.number().int().min(0).max(100),
  updatedAt: z.iso.datetime(),
  title: z.string().max(10000),
  description: z.string().max(30000),
  bullets: z.array(z.string().max(5000)).max(20),
  keywords: z.string().max(10000),
  rawText: z.string().max(50000),
  image: z.string().optional(),
  variants: z.array(variant).min(1).max(100),
  hsn: z.string().max(16),
  origin: z.string().max(120),
  weight: z.number().nonnegative(),
  approved: z.boolean(),
  workbookExample: z.object({
    sourceFilename: z.string(), sourceSha256: z.string().length(64), definitionCount: z.number().int(),
    skipped: z.array(z.object({ label: z.string(), pattern: z.string(), example: z.string(), reason: z.string() })),
  }).optional(),
});

export const seedDataSchema = z.object({
  version: z.number().int().positive(),
  description: z.string().min(1),
  profile: z.object({
    username: z.string().regex(/^[a-z0-9._-]{3,64}$/),
    name: z.string().trim().min(1).max(255),
    email: z.email().max(320),
    type: z.enum(["Agency", "Individual", "Freelance"]),
    workspace: z.string().trim().min(1).max(255),
    team: z.string().trim().min(1).max(255),
  }),
  brand: z.object({
    name: z.string().trim().min(1).max(255),
    tone: z.string().max(120),
    glossary: z.string().max(10000),
    bannedTerms: z.string().max(10000),
    painPoints: z.string().max(30000),
  }),
  products: z.array(product).min(1),
}).superRefine((data, ctx) => {
  const productIds = data.products.map((item) => item.id);
  const skus = data.products.flatMap((item) => item.variants.map((item) => item.sku.toLowerCase()));
  if (new Set(productIds).size !== productIds.length)
    ctx.addIssue({ code: "custom", message: "Product IDs must be unique.", path: ["products"] });
  if (new Set(skus).size !== skus.length)
    ctx.addIssue({ code: "custom", message: "Variant SKUs must be unique.", path: ["products"] });
  data.products.forEach((item, index) => {
    if (item.sku !== item.variants[0].sku)
      ctx.addIssue({ code: "custom", message: "Product display SKU must match its first variant.", path: ["products", index, "sku"] });
  });
});
