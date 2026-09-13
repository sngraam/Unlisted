// UI product contract. The server maps normalized Prisma records and validates all writes.
export type Marketplace = "Amazon" | "Flipkart";
export type SkuStatus =
  | "Draft"
  | "Processing"
  | "Ready"
  | "Published"
  | "Failed";
export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  mrp: number;
  price: number;
  stock: number;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
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
  variants: Variant[];
  hsn: string;
  origin: string;
  weight: number;
  approved: boolean;
}
