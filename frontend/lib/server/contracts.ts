// Validate all writable inputs before Prisma. The server derives status, scores and approvals.
import { z } from "zod";
const text = (max: number) => z.string().max(max);
const money = z
  .number()
  .finite()
  .min(0)
  .max(999999999999.99)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
    "Prices support two decimal places.",
  );
export const productInput = z
  .object({
    id: text(100),
    sku: text(100),
    name: text(500).trim().min(1),
    brand: text(255).trim().min(1),
    category: text(2000),
    productType: text(120).optional(),
    browseNodeId: text(120).optional(),
    templateId: z.uuid().optional(),
    marketplace: z.enum(["Amazon", "Flipkart"]),
    status: z.enum(["Draft", "Ready", "Published", "Processing", "Failed"]),
    score: z.number(),
    updatedAt: z.iso.datetime(),
    title: text(10000),
    description: text(30000),
    bullets: z.array(text(5000)).max(20),
    keywords: text(10000),
    rawText: text(50000),
    image: text(1500000)
      .optional()
      .refine(
        (v) =>
          !v ||
          /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ||
          /^\/[^/]/.test(v),
        "Use a local PNG, JPEG or WebP image.",
      ),
    images: z.array(text(1500000)).max(8).optional(),
    intake: z.object({
      productIdType: text(80),
      materials: text(30000),
      dimensions: text(30000),
      features: z.array(z.object({ label: text(120), value: text(1000) })).max(4),
      sourceFiles: z.array(z.object({ name: text(255), mimeType: text(120), sizeBytes: z.number().int().nonnegative().max(25_000_000) })).max(20),
      status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
      statusMessage: text(1000).optional(),
    }).optional(),
    variants: z
      .array(
        z
          .object({
            id: text(100),
            sku: text(100).trim().min(1),
            color: text(120),
            size: text(120),
            mrp: money,
            price: money,
            stock: z.number().int().min(0).max(2147483647),
            countryOfOrigin: text(120).optional(),
            hsnCode: text(16).optional(),
            weightKg: z.number().finite().min(0).max(9999999).nullable().optional(),
            channelAttributes: z.record(text(500), text(30000)).refine(
              (value) => Object.keys(value).length <= 2000,
              "Too many marketplace attributes.",
            ).optional(),
          })
          .refine((v) => v.price <= v.mrp, "Selling price cannot exceed MRP."),
      )
      .min(1)
      .max(100),
    hsn: text(16),
    origin: text(120),
    weight: z.number().finite().min(0).max(9999999),
    approved: z.boolean(),
  })
  .refine(
    (p) =>
      new Set(p.variants.map((v) => v.sku.toLowerCase())).size ===
      p.variants.length,
    "Each variant needs a unique SKU.",
  );
export const brandInput = z.object({
  name: text(255).trim().min(1),
  tone: text(120),
  glossary: text(10000),
  bannedTerms: text(10000),
  painPoints: text(30000),
  revenueRange: text(80).optional().default(""),
  competitors: text(10000).optional().default(""),
  targetAgeMin: text(3).optional().default(""),
  targetAgeMax: text(3).optional().default(""),
  targetCountries: text(10000).optional().default(""),
});
export const profileInput = z.object({
  name: text(255).trim().min(1),
  email: z.email().max(320),
  type: z.enum(["Agency", "Individual", "Freelance"]),
  workspace: text(255).trim().optional().default(""),
  team: text(255).trim().optional().default(""),
});
export const onboardingInput = z.object({
  source: z.enum(["google", "cold-call", "facebook", "cold-email", "instagram", "other"]),
  other: text(255).optional().default(""),
  marketplaces: z.array(z.enum(["Amazon", "Flipkart"])).max(2).default([]),
});
