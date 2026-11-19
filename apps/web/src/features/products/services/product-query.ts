import type { Product, ProductCategory, ProductStatus } from "../types/product";

export type SortKey = "updated-desc" | "updated-asc" | "name-asc" | "name-desc" | "code-asc";
export const SORT_LABELS: Record<SortKey, string> = {
  "updated-desc": "Cập nhật mới nhất",
  "updated-asc": "Cập nhật cũ nhất",
  "name-asc": "Tên A → Z",
  "name-desc": "Tên Z → A",
  "code-asc": "Mã sản phẩm"
};

export interface ProductQuery {
  search: string;
  category: ProductCategory | "all";
  status: ProductStatus | "all";
  sort: SortKey;
}
export const DEFAULT_QUERY: ProductQuery = { search: "", category: "all", status: "all", sort: "updated-desc" };

export function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replaceAll("đ", "d").replaceAll("Đ", "d").toLowerCase().trim();
}

/** Matches the product name, internal code and variant SKUs. Accent-insensitive. */
export function matchesSearch(product: Product, search: string) {
  const needle = normalizeText(search);
  if (!needle) return true;
  const haystack = normalizeText([product.name, product.code, ...product.variants.map(v => v.sku)].join(" "));
  return needle.split(/\s+/).every(token => haystack.includes(token));
}

export function queryProducts(products: readonly Product[], query: ProductQuery): Product[] {
  const rows = products.filter(
    p =>
      matchesSearch(p, query.search) &&
      (query.category === "all" || p.category === query.category) &&
      (query.status === "all" || p.status === query.status)
  );
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, "vi");
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    "updated-desc": (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    "updated-asc": (a, b) => a.updatedAt.localeCompare(b.updatedAt),
    "name-asc": byName,
    "name-desc": (a, b) => byName(b, a),
    "code-asc": (a, b) => a.code.localeCompare(b.code)
  };
  return rows.sort(sorters[query.sort]);
}

export function isFiltered(query: ProductQuery) {
  return query.search.trim() !== "" || query.category !== "all" || query.status !== "all";
}

export interface Readiness {
  checks: { key: string; label: string; done: boolean }[];
  done: number;
  total: number;
  complete: boolean;
}

export function getReadiness(product: Pick<Product, "name" | "category" | "variants" | "assets" | "facts">): Readiness {
  const checks = [
    { key: "info", label: "Thông tin cơ bản", done: product.name.trim().length > 0 && Boolean(product.category) },
    { key: "variants", label: "Có phân loại SKU", done: product.variants.length > 0 },
    { key: "assets", label: "Có ảnh sản phẩm", done: product.assets.length > 0 },
    { key: "facts", label: "Có đặc tính đã xác minh", done: product.facts.some(f => f.verified) }
  ];
  const done = checks.filter(c => c.done).length;
  return { checks, done, total: checks.length, complete: done === checks.length };
}

export function countByCategory(products: readonly Product[]) {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function mainAsset(product: Pick<Product, "assets">) {
  return product.assets.find(a => a.isMain) ?? product.assets[0];
}
