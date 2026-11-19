import { getReadiness, normalizeText } from "@/features/products/services/product-query";
import type { Product, ProductVariant } from "@/features/products/types/product";
import { buildSlots, DEFAULT_PRESET_ID, getPreset, PRESETS, type ProductionPreset } from "./presets";
import {
  BACKGROUND_MODES,
  MAX_INSTRUCTIONS,
  RATIO_INFO,
  SLOT_COUNT,
  type FlowConfig,
  type FlowSnapshot,
  type FlowStatus,
  type ProductionFlow,
  type RatioChoice
} from "../types/production";

/* ---------- configuration ---------- */

export function configFromPreset(preset: ProductionPreset): FlowConfig {
  return {
    templateSetId: preset.id,
    templateSetName: preset.name,
    outputRatios: preset.defaultRatios,
    productionMode: "TEMPLATE",
    imageStyle: preset.defaultStyle,
    backgroundMode: "ORIGINAL",
    solidColor: "#F5F1E8",
    creativeInstructions: "",
    slots: buildSlots(preset)
  };
}

export function defaultConfig(): FlowConfig {
  return configFromPreset(getPreset(DEFAULT_PRESET_ID) ?? PRESETS[0]!);
}

/** Replaces the template set, slots and default style. Keeps the user's other choices. Ratios fall back when unsupported. */
export function applyPreset(config: FlowConfig, preset: ProductionPreset): FlowConfig {
  return {
    ...config,
    templateSetId: preset.id,
    templateSetName: preset.name,
    imageStyle: preset.defaultStyle,
    outputRatios: preset.supportedRatios.includes(config.outputRatios) ? config.outputRatios : preset.defaultRatios,
    slots: buildSlots(preset)
  };
}

export function ratioFormats(ratios: RatioChoice) {
  return RATIO_INFO[ratios].formats;
}

/** Nine logical slots × number of output ratios. These are planned files, not rendered ones. */
export function expectedImageCount(config: Pick<FlowConfig, "outputRatios">) {
  return SLOT_COUNT * RATIO_INFO[config.outputRatios].formats.length;
}

export function validateConfig(config: FlowConfig): string[] {
  const errors: string[] = [];
  if (config.slots.length !== SLOT_COUNT) errors.push("Bộ ảnh phải có đúng " + SLOT_COUNT + " khung.");
  else if (new Set(config.slots.map(s => s.index)).size !== SLOT_COUNT) errors.push("Thứ tự các khung ảnh bị trùng.");
  if (!RATIO_INFO[config.outputRatios]) errors.push("Chưa chọn tỷ lệ đầu ra hợp lệ.");
  const preset = getPreset(config.templateSetId);
  if (!preset) errors.push("Bộ template không tồn tại.");
  else if (RATIO_INFO[config.outputRatios] && !preset.supportedRatios.includes(config.outputRatios)) {
    errors.push(preset.name + " không hỗ trợ tỷ lệ " + RATIO_INFO[config.outputRatios].label + ".");
  }
  if (!BACKGROUND_MODES.includes(config.backgroundMode)) errors.push("Chế độ nền không hợp lệ.");
  if (config.backgroundMode === "SOLID" && !/^#[0-9a-fA-F]{6}$/.test(config.solidColor)) errors.push("Màu nền đơn sắc phải có dạng #RRGGBB.");
  if (config.creativeInstructions.length > MAX_INSTRUCTIONS) errors.push("Hướng dẫn sáng tạo tối đa " + MAX_INSTRUCTIONS + " ký tự.");
  return errors;
}

/** Settings that only describe future behaviour and must be labelled as such in the UI. */
export function futureFeatureNotes(config: Pick<FlowConfig, "productionMode" | "backgroundMode">): string[] {
  const notes: string[] = [];
  if (config.productionMode !== "TEMPLATE") notes.push("Chế độ AI chưa được kết nối. Cấu hình chỉ được lưu cho giai đoạn sau.");
  if (config.backgroundMode === "AI_GENERATED") notes.push("Nền do AI tạo chưa được kết nối.");
  return notes;
}

/* ---------- product eligibility ---------- */

export interface Eligibility {
  complete: boolean;
  /** Vietnamese reasons, one per missing item */
  reasons: string[];
}

const MISSING_TEXT: Record<string, string> = {
  info: "Thiếu thông tin cơ bản",
  variants: "Chưa có phân loại SKU",
  assets: "Chưa có ảnh sản phẩm",
  facts: "Chưa có đặc tính đã xác minh"
};

export function productEligibility(product: Pick<Product, "name" | "category" | "variants" | "assets" | "facts">): Eligibility {
  const readiness = getReadiness(product);
  return { complete: readiness.complete, reasons: readiness.checks.filter(c => !c.done).map(c => MISSING_TEXT[c.key] ?? c.label) };
}

/* ---------- selection ---------- */

/** productId -> chosen variant ids. A product without variants maps to an empty array (one product-level flow). */
export type Selection = Record<string, string[]>;

export interface FlowTarget {
  productId: string;
  variantId?: string;
}

export function toggleProduct(selection: Selection, product: Pick<Product, "id" | "variants">): Selection {
  if (product.id in selection) {
    const next = { ...selection };
    delete next[product.id];
    return next;
  }
  return { ...selection, [product.id]: product.variants.map(v => v.id) };
}

export function toggleVariant(selection: Selection, product: Pick<Product, "id" | "variants">, variantId: string): Selection {
  if (!product.variants.some(v => v.id === variantId)) return selection;
  const current = selection[product.id] ?? [];
  const chosen = current.includes(variantId) ? current.filter(id => id !== variantId) : [...current, variantId];
  if (chosen.length === 0) {
    const next = { ...selection };
    delete next[product.id];
    return next;
  }
  return { ...selection, [product.id]: product.variants.map(v => v.id).filter(id => chosen.includes(id)) };
}

/** Drops products or variants that no longer exist, so a stale selection can never create orphan flows. */
export function pruneSelection(selection: Selection, products: readonly Product[]): Selection {
  const next: Selection = {};
  for (const [productId, variantIds] of Object.entries(selection)) {
    const product = products.find(p => p.id === productId);
    if (!product) continue;
    if (product.variants.length === 0) {
      next[productId] = [];
      continue;
    }
    const kept = variantIds.filter(id => product.variants.some(v => v.id === id));
    if (kept.length > 0) next[productId] = kept;
  }
  return next;
}

export function expandTargets(selection: Selection, products: readonly Product[]): FlowTarget[] {
  const targets: FlowTarget[] = [];
  for (const product of products) {
    const chosen = selection[product.id];
    if (!chosen) continue;
    if (product.variants.length === 0) targets.push({ productId: product.id });
    else for (const variant of product.variants) if (chosen.includes(variant.id)) targets.push({ productId: product.id, variantId: variant.id });
  }
  return targets;
}

/** Two selected variants can share a SKU across products; creating them is allowed but flagged. */
export function duplicateSkuTargets(targets: readonly FlowTarget[], products: readonly Product[]): string[] {
  const counts = new Map<string, number>();
  for (const t of targets) {
    const sku = products.find(p => p.id === t.productId)?.variants.find(v => v.id === t.variantId)?.sku;
    if (sku) counts.set(sku, (counts.get(sku) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([sku]) => sku);
}

export const targetKey = (t: FlowTarget) => t.productId + "::" + (t.variantId ?? "");

/* ---------- flow records ---------- */

export function variantLabel(variant: Pick<ProductVariant, "color" | "size">) {
  return [variant.color, variant.size].filter(Boolean).join(" · ");
}

export function snapshotFor(product: Product, variant?: ProductVariant): FlowSnapshot {
  return {
    productName: product.name,
    productCode: product.code,
    category: product.category,
    variantSku: variant?.sku,
    variantLabel: variant ? variantLabel(variant) : undefined
  };
}

export interface FlowRow {
  flow: ProductionFlow;
  product?: Product;
  variant?: ProductVariant;
  /** why the flow cannot start, empty when it can */
  blockers: string[];
  status: FlowStatus;
  missing?: "product" | "variant";
}

/**
 * Joins a stored flow with the current product data. DRAFT/READY are derived from live readiness so they can
 * never go stale when the product is edited; every other status is stored.
 */
export function toRow(flow: ProductionFlow, products: readonly Product[]): FlowRow {
  const product = products.find(p => p.id === flow.productId);
  const variant = flow.variantId ? product?.variants.find(v => v.id === flow.variantId) : undefined;
  let missing: FlowRow["missing"];
  const blockers: string[] = [];
  if (!product) {
    missing = "product";
    blockers.push("Sản phẩm đã bị xóa");
  } else {
    if (flow.variantId && !variant) {
      missing = "variant";
      blockers.push("Phân loại đã bị xóa");
    }
    blockers.push(...productEligibility(product).reasons);
  }
  const status: FlowStatus = flow.status === "DRAFT" || flow.status === "READY" ? (blockers.length === 0 ? "READY" : "DRAFT") : flow.status;
  return { flow, product, variant, blockers, status, missing };
}

export function toRows(flows: readonly ProductionFlow[], products: readonly Product[]): FlowRow[] {
  return flows.map(f => toRow(f, products));
}

export interface Summary {
  total: number;
  ready: number;
  simulating: number;
  completed: number;
  failed: number;
}

export function summarize(rows: readonly FlowRow[]): Summary {
  const count = (s: FlowStatus) => rows.filter(r => r.status === s).length;
  return { total: rows.length, ready: count("READY"), simulating: count("SIMULATING"), completed: count("DEMO_COMPLETED"), failed: count("DEMO_FAILED") };
}

/* ---------- table query ---------- */

export type FlowSort = "updated-desc" | "updated-asc" | "name-asc" | "name-desc" | "status";
export const FLOW_SORT_LABELS: Record<FlowSort, string> = {
  "updated-desc": "Cập nhật mới nhất",
  "updated-asc": "Cập nhật cũ nhất",
  "name-asc": "Tên A → Z",
  "name-desc": "Tên Z → A",
  status: "Trạng thái"
};

export interface FlowQuery {
  search: string;
  status: FlowStatus | "all";
  category: string;
  sort: FlowSort;
}
export const DEFAULT_FLOW_QUERY: FlowQuery = { search: "", status: "all", category: "all", sort: "updated-desc" };

export function isFlowFiltered(q: FlowQuery) {
  return q.search.trim() !== "" || q.status !== "all" || q.category !== "all";
}

const STATUS_ORDER: Record<FlowStatus, number> = { SIMULATING: 0, DEMO_FAILED: 1, READY: 2, DRAFT: 3, CANCELLED: 4, DEMO_COMPLETED: 5 };

export function queryRows(rows: readonly FlowRow[], q: FlowQuery): FlowRow[] {
  const needle = q.search.trim();
  const matches = (r: FlowRow) => {
    if (!needle) return true;
    // only this flow's own variant SKU is searchable, so a SKU query finds the flow of that variant
    const haystack = normalizeText([r.product?.name ?? "", r.product?.code ?? "", r.flow.snapshot.productName, r.flow.snapshot.productCode, r.variant?.sku ?? r.flow.snapshot.variantSku ?? ""].join(" "));
    return normalizeText(needle).split(/\s+/).every(t => haystack.includes(t));
  };
  const name = (r: FlowRow) => r.product?.name ?? r.flow.snapshot.productName;
  const sorters: Record<FlowSort, (a: FlowRow, b: FlowRow) => number> = {
    "updated-desc": (a, b) => b.flow.updatedAt.localeCompare(a.flow.updatedAt),
    "updated-asc": (a, b) => a.flow.updatedAt.localeCompare(b.flow.updatedAt),
    "name-asc": (a, b) => name(a).localeCompare(name(b), "vi"),
    "name-desc": (a, b) => name(b).localeCompare(name(a), "vi"),
    status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  };
  return rows
    .filter(r => matches(r) && (q.status === "all" || r.status === q.status) && (q.category === "all" || (r.product?.category ?? r.flow.snapshot.category) === q.category))
    .sort(sorters[q.sort]);
}

export const PAGE_SIZE = 10;

export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages, total: items.length };
}
