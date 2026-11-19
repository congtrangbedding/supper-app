import { z } from "zod";

export const PRODUCT_CATEGORIES = ["Chiếu mát", "Chiếu tre", "Chiếu mây", "Chăn", "Bộ chăn ga", "Gối", "Thảm"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_STATUSES = ["draft", "ready", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export const STATUS_LABELS: Record<ProductStatus, string> = { draft: "Bản nháp", ready: "Sẵn sàng", archived: "Lưu trữ" };

export const ASSET_LIMITS = { maxFiles: 8, maxBytes: 3 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] as readonly string[] };

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  size: string;
}

/** A fact is only "verified" when the seller explicitly confirms it. Nothing here is AI-verified. */
export interface ProductFact {
  id: string;
  label: string;
  value: string;
  verified: boolean;
  evidence: string;
}

/**
 * Sample assets point at a file under /public. Local assets keep only metadata here;
 * the bytes live in IndexedDB (see asset-store) and are never put in localStorage.
 */
export interface ProductAsset {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  source: "sample" | "local";
  url: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: ProductCategory;
  brand: string;
  description: string;
  material: string;
  color: string;
  pattern: string;
  dimensions: string;
  features: string[];
  notes: string;
  facts: ProductFact[];
  variants: ProductVariant[];
  assets: ProductAsset[];
  status: ProductStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

const text = z.string();
export const productSchema: z.ZodType<Product> = z.object({
  id: text.min(1),
  name: text,
  code: text,
  category: z.enum(PRODUCT_CATEGORIES),
  brand: text,
  description: text,
  material: text,
  color: text,
  pattern: text,
  dimensions: text,
  features: z.array(text),
  notes: text,
  facts: z.array(z.object({ id: text, label: text, value: text, verified: z.boolean(), evidence: text })),
  variants: z.array(z.object({ id: text, sku: text, color: text, size: text })),
  assets: z.array(
    z.object({
      id: text,
      name: text,
      size: z.number(),
      mimeType: text,
      source: z.enum(["sample", "local"]),
      url: text,
      isMain: z.boolean()
    })
  ),
  status: z.enum(PRODUCT_STATUSES),
  isSample: z.boolean(),
  createdAt: text,
  updatedAt: text
});

/** Values that the create/edit form edits. Assets are managed separately from react-hook-form. */
export interface ProductFormValues {
  name: string;
  code: string;
  category: ProductCategory;
  brand: string;
  description: string;
  material: string;
  color: string;
  pattern: string;
  dimensions: string;
  featuresText: string;
  notes: string;
  facts: { id: string; label: string; value: string; verified: boolean; evidence: string }[];
  variants: { id: string; sku: string; color: string; size: string }[];
  status: ProductStatus;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "isSample">;
