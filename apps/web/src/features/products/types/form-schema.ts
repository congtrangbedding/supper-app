import { z } from "zod";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, type Product, type ProductFormValues } from "./product";
import { normalizeText } from "../services/product-query";

export interface SkuIndexEntry {
  id: string;
  code: string;
  variantSkus: string[];
}

export function buildSkuIndex(products: readonly Product[]): SkuIndexEntry[] {
  return products.map(p => ({ id: p.id, code: p.code, variantSkus: p.variants.map(v => v.sku) }));
}

export interface SchemaContext {
  /** id of the product being edited; excluded from the uniqueness checks */
  currentId?: string;
  existing: readonly SkuIndexEntry[];
  /** number of images in the form; uploads are not part of react-hook-form state */
  assetCount: number;
}

const same = (a: string, b: string) => normalizeText(a) === normalizeText(b);

export function createProductFormSchema(ctx: SchemaContext) {
  return z
    .object({
      name: z.string().trim().min(2, "Nhập tên sản phẩm (ít nhất 2 ký tự).").max(160, "Tên tối đa 160 ký tự."),
      code: z
        .string()
        .trim()
        .min(1, "Nhập mã sản phẩm nội bộ.")
        .max(40, "Mã tối đa 40 ký tự.")
        .regex(/^[A-Za-z0-9._-]+$/, "Mã chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới."),
      category: z.enum(PRODUCT_CATEGORIES, { error: "Chọn danh mục sản phẩm." }),
      brand: z.string().trim().max(80, "Thương hiệu tối đa 80 ký tự."),
      description: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự."),
      material: z.string().trim().max(120),
      color: z.string().trim().max(80),
      pattern: z.string().trim().max(120),
      dimensions: z.string().trim().max(120),
      featuresText: z.string().max(2000, "Tính năng tối đa 2000 ký tự."),
      notes: z.string().max(2000, "Ghi chú tối đa 2000 ký tự."),
      facts: z.array(
        z.object({
          id: z.string(),
          label: z.string().trim().min(1, "Nhập tên đặc tính."),
          value: z.string().trim().min(1, "Nhập giá trị."),
          verified: z.boolean(),
          evidence: z.string().trim().max(300)
        })
      ),
      variants: z.array(
        z.object({
          id: z.string(),
          sku: z
            .string()
            .trim()
            .min(1, "Nhập SKU.")
            .max(40, "SKU tối đa 40 ký tự.")
            .regex(/^[A-Za-z0-9._-]+$/, "SKU chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới."),
          color: z.string().trim().max(60),
          size: z.string().trim().max(60)
        })
      ),
      status: z.enum(PRODUCT_STATUSES)
    })
    .superRefine((values, issue) => {
      const others = ctx.existing.filter(e => e.id !== ctx.currentId);
      if (others.some(e => same(e.code, values.code) || e.variantSkus.some(s => same(s, values.code)))) {
        issue.addIssue({ code: "custom", path: ["code"], message: "Mã sản phẩm đã được dùng." });
      }
      const seen = new Map<string, number>();
      values.variants.forEach((variant, index) => {
        const key = normalizeText(variant.sku);
        if (!key) return;
        if (seen.has(key)) issue.addIssue({ code: "custom", path: ["variants", index, "sku"], message: "SKU bị trùng trong sản phẩm này." });
        seen.set(key, index);
        if (same(variant.sku, values.code)) {
          issue.addIssue({ code: "custom", path: ["variants", index, "sku"], message: "SKU trùng với mã sản phẩm." });
        } else if (others.some(e => same(e.code, variant.sku) || e.variantSkus.some(s => same(s, variant.sku)))) {
          issue.addIssue({ code: "custom", path: ["variants", index, "sku"], message: "SKU đã được dùng ở sản phẩm khác." });
        }
      });
      if (values.status === "ready") {
        const missing: string[] = [];
        if (values.variants.length === 0) missing.push("ít nhất một phân loại SKU");
        if (ctx.assetCount === 0) missing.push("ít nhất một ảnh");
        if (!values.facts.some(f => f.verified)) missing.push("ít nhất một đặc tính đã xác minh");
        if (missing.length) {
          issue.addIssue({ code: "custom", path: ["status"], message: "Trạng thái Sẵn sàng cần " + missing.join(", ") + "." });
        }
      }
    });
}

export type ProductFormSchema = ReturnType<typeof createProductFormSchema>;

export function emptyFormValues(): ProductFormValues {
  return {
    name: "",
    code: "",
    category: PRODUCT_CATEGORIES[0],
    brand: "",
    description: "",
    material: "",
    color: "",
    pattern: "",
    dimensions: "",
    featuresText: "",
    notes: "",
    facts: [],
    variants: [],
    status: "draft"
  };
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    code: product.code,
    category: product.category,
    brand: product.brand,
    description: product.description,
    material: product.material,
    color: product.color,
    pattern: product.pattern,
    dimensions: product.dimensions,
    featuresText: product.features.join("\n"),
    notes: product.notes,
    facts: product.facts.map(f => ({ ...f })),
    variants: product.variants.map(v => ({ ...v })),
    status: product.status
  };
}

export function parseFeatures(text: string) {
  return text.split("\n").map(line => line.trim()).filter(Boolean);
}

let counter = 0;
export function newId(prefix: string) {
  counter += 1;
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : String(Date.now()) + counter;
  return prefix + "-" + random;
}

export function addVariant<T extends { id: string; sku: string; color: string; size: string }>(variants: readonly T[], make: () => T): T[] {
  return [...variants, make()];
}
export function removeVariant<T extends { id: string }>(variants: readonly T[], id: string): T[] {
  return variants.filter(v => v.id !== id);
}
export const blankVariant = () => ({ id: newId("var"), sku: "", color: "", size: "" });
export const blankFact = () => ({ id: newId("fact"), label: "", value: "", verified: false, evidence: "" });
