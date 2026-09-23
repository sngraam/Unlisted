// UI product contract. The server maps normalized Prisma records and validates all writes.
export type Marketplace = "Amazon" | "Flipkart";
export type SkuStatus =
  | "Draft"
  | "Processing"
  | "Ready"
  | "Published"
  | "Failed";
export type IntakeStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
export interface ProductSourceFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
}
export interface ProductFeatureFact {
  label: string;
  value: string;
}
export interface ProductIntake {
  productIdType: string;
  materials: string;
  dimensions: string;
  features: ProductFeatureFact[];
  sourceFiles: ProductSourceFile[];
  status?: IntakeStatus;
  statusMessage?: string;
}
export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  mrp: number;
  price: number;
  stock: number;
  countryOfOrigin?: string;
  hsnCode?: string;
  weightKg?: number | null;
  // Exact row-5 keys from the selected marketplace template, scoped to this SKU.
  channelAttributes?: Record<string, string>;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  productType?: string;
  browseNodeId?: string;
  templateId?: string;
  categoryLocked?: boolean;
  workbookExample?: { sourceFilename: string; definitionCount: number; skippedCount: number };
  marketplace: Marketplace;
  status: SkuStatus;
  score: number;
  updatedAt: string;
  title: string;
  description: string;
  bullets: string[];
  keywords: string;
  rawText: string;
  image?: string;
  images?: string[];
  intake?: ProductIntake;
  variants: Variant[];
  hsn: string;
  origin: string;
  weight: number;
  approved: boolean;
}
