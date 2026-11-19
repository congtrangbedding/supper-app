import { describe, expect, it } from "vitest";
import { byId, config, inputFor, makeRepo, seed } from "../test-utils";
import {
  applyPreset,
  DEFAULT_FLOW_QUERY,
  duplicateSkuTargets,
  expandTargets,
  expectedImageCount,
  futureFeatureNotes,
  paginate,
  productEligibility,
  pruneSelection,
  queryRows,
  summarize,
  toggleProduct,
  toggleVariant,
  toRow,
  toRows,
  validateConfig
} from "./flow-model";
import { buildSlots, getPreset, PRESETS } from "./presets";
import { SLOT_COUNT, SLOT_KEYS } from "../types/production";

const products = seed();
const cooling = byId(products, "sample-cooling"); // ready, 2 variants
const rattan = byId(products, "sample-rattan"); // draft: no image, no verified fact

describe("configuration", () => {
  it("builds exactly nine ordered slots from every preset", () => {
    for (const preset of PRESETS) {
      const slots = buildSlots(preset);
      expect(slots).toHaveLength(SLOT_COUNT);
      expect(slots.map(s => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(slots.map(s => s.key)).toEqual([...SLOT_KEYS]);
      expect(new Set(slots.map(s => s.templateId)).size).toBe(9);
    }
  });
  it("calculates the expected output count from the ratios", () => {
    expect(expectedImageCount({ outputRatios: "SQUARE" })).toBe(9);
    expect(expectedImageCount({ outputRatios: "PORTRAIT" })).toBe(9);
    expect(expectedImageCount({ outputRatios: "BOTH" })).toBe(18);
  });
  it("accepts the default config and rejects invalid values", () => {
    expect(validateConfig(config())).toEqual([]);
    expect(validateConfig({ ...config(), slots: config().slots.slice(0, 8) })[0]).toMatch(/đúng 9/);
    expect(validateConfig({ ...config(), backgroundMode: "SOLID", solidColor: "red" }).join()).toMatch(/#RRGGBB/);
    expect(validateConfig({ ...config(), backgroundMode: "SOLID", solidColor: "#aabbcc" })).toEqual([]);
    expect(validateConfig({ ...config(), creativeInstructions: "x".repeat(1001) }).join()).toMatch(/1000/);
    expect(validateConfig({ ...config(), templateSetId: "nope" }).join()).toMatch(/không tồn tại/);
  });
  it("rejects ratios the template set does not support", () => {
    const promo = getPreset("promotional")!;
    expect(validateConfig({ ...applyPreset(config(), promo), outputRatios: "PORTRAIT" }).join()).toMatch(/không hỗ trợ/);
  });
  it("applies a preset without touching other choices, and falls back to a supported ratio", () => {
    const base = { ...config(), outputRatios: "PORTRAIT" as const, creativeInstructions: "giữ nguyên", productionMode: "HYBRID" as const };
    const promo = applyPreset(base, getPreset("promotional")!);
    expect(promo.templateSetId).toBe("promotional");
    expect(promo.imageStyle).toBe("PROMO");
    expect(promo.outputRatios).toBe("SQUARE"); // PORTRAIT unsupported
    expect(promo.creativeInstructions).toBe("giữ nguyên");
    expect(promo.productionMode).toBe("HYBRID");
    expect(promo.slots[0]!.templateId).toBe("PRM-01");
    const lifestyle = applyPreset({ ...base, outputRatios: "BOTH" }, getPreset("lifestyle-bedroom")!);
    expect(lifestyle.outputRatios).toBe("BOTH");
  });
  it("flags AI settings that are not connected", () => {
    expect(futureFeatureNotes({ productionMode: "TEMPLATE", backgroundMode: "ORIGINAL" })).toEqual([]);
    expect(futureFeatureNotes({ productionMode: "HYBRID", backgroundMode: "AI_GENERATED" })).toHaveLength(2);
  });
});

describe("product eligibility and selection", () => {
  it("explains why a product is not ready", () => {
    expect(productEligibility(cooling)).toEqual({ complete: true, reasons: [] });
    const result = productEligibility(rattan);
    expect(result.complete).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(["Chưa có ảnh sản phẩm", "Chưa có đặc tính đã xác minh"]));
    expect(productEligibility({ ...cooling, assets: [] }).reasons).toEqual(["Chưa có ảnh sản phẩm"]);
    expect(productEligibility({ ...cooling, facts: cooling.facts.map(f => ({ ...f, verified: false })) }).reasons).toEqual(["Chưa có đặc tính đã xác minh"]);
  });
  it("selecting a product selects all its variants; variants toggle independently", () => {
    let sel = toggleProduct({}, cooling);
    expect(sel[cooling.id]).toEqual(cooling.variants.map(v => v.id));
    sel = toggleVariant(sel, cooling, cooling.variants[0]!.id);
    expect(sel[cooling.id]).toEqual([cooling.variants[1]!.id]);
    sel = toggleVariant(sel, cooling, cooling.variants[1]!.id);
    expect(sel).toEqual({}); // last variant removed deselects the product
    expect(toggleVariant({}, cooling, "ghost")).toEqual({});
    expect(toggleProduct(toggleProduct({}, cooling), cooling)).toEqual({});
  });
  it("expands one target per product/variant and none for an empty selection", () => {
    expect(expandTargets({}, products)).toEqual([]);
    const targets = expandTargets({ [cooling.id]: cooling.variants.map(v => v.id) }, products);
    expect(targets).toHaveLength(cooling.variants.length);
    const noVariant = { ...cooling, id: "nv", variants: [] };
    expect(expandTargets({ nv: [] }, [noVariant])).toEqual([{ productId: "nv" }]);
  });
  it("drops deleted products and variants from a stale selection", () => {
    const stale = { [cooling.id]: [cooling.variants[0]!.id, "ghost"], gone: ["x"] };
    expect(pruneSelection(stale, products)).toEqual({ [cooling.id]: [cooling.variants[0]!.id] });
  });
  it("reports SKUs that appear twice in a selection", () => {
    const a = { ...cooling, id: "a" };
    const b = { ...cooling, id: "b" };
    const targets = [{ productId: "a", variantId: cooling.variants[0]!.id }, { productId: "b", variantId: cooling.variants[0]!.id }];
    expect(duplicateSkuTargets(targets, [a, b])).toEqual([cooling.variants[0]!.sku]);
    expect(duplicateSkuTargets(targets.slice(0, 1), [a, b])).toEqual([]);
  });
});

describe("rows, filtering and pagination", () => {
  async function build() {
    const { repo } = makeRepo();
    const { created } = await repo.createFlows([inputFor(cooling, 0), inputFor(cooling, 1), inputFor(rattan, 0), inputFor(byId(products, "sample-bamboo"))], config());
    return created;
  }
  it("derives DRAFT/READY from live product readiness", async () => {
    const flows = await build();
    const rows = toRows(flows, products);
    const byProduct = (id: string) => rows.filter(r => r.flow.productId === id).map(r => r.status);
    expect(byProduct(cooling.id)).toEqual(["READY", "READY"]);
    expect(byProduct(rattan.id)).toEqual(["DRAFT"]);
    expect(rows.find(r => r.product?.id === rattan.id)!.blockers.length).toBeGreaterThan(0);
  });
  it("keeps showing a flow after its product or variant is deleted", async () => {
    const [flow] = await build();
    const noProduct = toRow(flow!, products.filter(p => p.id !== cooling.id));
    expect(noProduct.missing).toBe("product");
    expect(noProduct.status).toBe("DRAFT");
    expect(noProduct.blockers).toContain("Sản phẩm đã bị xóa");
    const noVariant = toRow(flow!, products.map(p => (p.id === cooling.id ? { ...p, variants: p.variants.slice(1) } : p)));
    expect(noVariant.missing).toBe("variant");
    expect(flow!.snapshot.productName).toBe(cooling.name); // snapshot survives
  });
  it("does not rewrite stored terminal statuses", async () => {
    const [flow] = await build();
    expect(toRow({ ...flow!, status: "DEMO_COMPLETED" }, products).status).toBe("DEMO_COMPLETED");
  });
  it("searches by accent-insensitive name, code and SKU, filters and sorts", async () => {
    const rows = toRows(await build(), products);
    const q = (patch: object) => queryRows(rows, { ...DEFAULT_FLOW_QUERY, ...patch });
    expect(q({ search: "dieu hoa moc ha" })).toHaveLength(2);
    expect(q({ search: cooling.variants[1]!.sku })).toHaveLength(1);
    expect(q({ search: "tt-180" }).length).toBeGreaterThan(0);
    expect(q({ search: "không có gì" })).toHaveLength(0);
    expect(q({ status: "DRAFT" })).toHaveLength(1);
    expect(q({ category: "Chiếu mây" })).toHaveLength(1);
    const names = q({ sort: "name-asc" }).map(r => r.product!.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "vi")));
    expect(q({ sort: "status" })[0]!.status).toBe("READY");
  });
  it("searches orphaned flows by snapshot", async () => {
    const rows = toRows(await build(), []);
    expect(queryRows(rows, { ...DEFAULT_FLOW_QUERY, search: "Mộc Hạ" }).length).toBe(2);
  });
  it("summarizes from data and paginates safely", async () => {
    const rows = toRows(await build(), products);
    expect(summarize(rows)).toEqual({ total: 4, ready: 3, simulating: 0, completed: 0, failed: 0 });
    expect(summarize([])).toEqual({ total: 0, ready: 0, simulating: 0, completed: 0, failed: 0 });
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(items, 3).items).toHaveLength(3);
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate([], 1)).toMatchObject({ pages: 1, total: 0 });
  });
});
