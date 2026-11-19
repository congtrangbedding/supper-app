import { describe, expect, it } from "vitest";
import { addVariant, blankVariant, buildSkuIndex, createProductFormSchema, emptyFormValues, parseFeatures, productToFormValues, removeVariant } from "./form-schema";
import type { ProductFormValues } from "./product";
import { seed } from "../test-utils";

const existing = buildSkuIndex(seed());
const schema = (overrides: { currentId?: string; assetCount?: number } = {}) => createProductFormSchema({ existing, assetCount: 0, ...overrides });
const valid = (patch: Partial<ProductFormValues> = {}): ProductFormValues => ({ ...emptyFormValues(), name: "Chiếu mới", code: "NEW-1", ...patch });
const issues = (values: ProductFormValues, ctx = {}) => {
  const result = schema(ctx).safeParse(values);
  return result.success ? [] : result.error.issues.map(i => ({ path: i.path.join("."), message: i.message }));
};

describe("product form validation", () => {
  it("accepts a minimal valid product", () => {
    expect(issues(valid())).toEqual([]);
  });

  it("reports required fields with Vietnamese messages", () => {
    const found = issues(valid({ name: " ", code: "" }));
    expect(found).toContainEqual({ path: "name", message: "Nhập tên sản phẩm (ít nhất 2 ký tự)." });
    expect(found.find(i => i.path === "code")?.message).toBe("Nhập mã sản phẩm nội bộ.");
  });

  it("rejects codes with unsupported characters and unknown categories", () => {
    expect(issues(valid({ code: "mã có dấu" })).some(i => i.path === "code")).toBe(true);
    expect(issues({ ...valid(), category: "Không có" as never }).some(i => i.path === "category")).toBe(true);
  });

  it("rejects a product code already used by another product (case-insensitive)", () => {
    expect(issues(valid({ code: "mh-160" }))).toContainEqual({ path: "code", message: "Mã sản phẩm đã được dùng." });
  });

  it("allows keeping the product's own code when editing", () => {
    expect(issues(valid({ code: "MH-160" }), { currentId: "sample-cooling" })).toEqual([]);
  });
});

describe("duplicate SKU validation", () => {
  const variant = (sku: string) => ({ ...blankVariant(), sku });

  it("flags duplicates inside the same product", () => {
    const found = issues(valid({ variants: [variant("A-1"), variant("a-1")] }));
    expect(found).toContainEqual({ path: "variants.1.sku", message: "SKU bị trùng trong sản phẩm này." });
  });
  it("flags SKUs used by another product", () => {
    expect(issues(valid({ variants: [variant("TT-160-MO")] }))).toContainEqual({ path: "variants.0.sku", message: "SKU đã được dùng ở sản phẩm khác." });
  });
  it("flags a variant SKU equal to the product code", () => {
    expect(issues(valid({ variants: [variant("NEW-1")] }))).toContainEqual({ path: "variants.0.sku", message: "SKU trùng với mã sản phẩm." });
  });
  it("accepts unique SKUs and the product's own existing SKUs when editing", () => {
    expect(issues(valid({ variants: [variant("U-1"), variant("U-2")] }))).toEqual([]);
    expect(issues(valid({ code: "TT-180", variants: [variant("TT-160-MO")] }), { currentId: "sample-bamboo" })).toEqual([]);
  });
  it("requires a SKU on each variant", () => {
    expect(issues(valid({ variants: [variant("")] }))).toContainEqual({ path: "variants.0.sku", message: "Nhập SKU." });
  });
});

describe("variant add/remove", () => {
  it("adds and removes variants without mutating the original", () => {
    const original = [blankVariant()];
    const added = addVariant(original, blankVariant);
    expect(added).toHaveLength(2);
    expect(original).toHaveLength(1);
    const removed = removeVariant(added, added[0].id);
    expect(removed.map(v => v.id)).toEqual([added[1].id]);
    expect(removeVariant(removed, "missing")).toHaveLength(1);
  });
  it("creates blank variants with unique ids", () => {
    expect(blankVariant().id).not.toBe(blankVariant().id);
  });
});

describe("form error states", () => {
  it("requires evidence of readiness before status Ready", () => {
    const found = issues(valid({ status: "ready" }));
    const message = found.find(i => i.path === "status")?.message ?? "";
    expect(message).toMatch(/Sẵn sàng cần/);
    expect(message).toMatch(/phân loại SKU/);
    expect(message).toMatch(/ảnh/);
    expect(message).toMatch(/đặc tính đã xác minh/);
  });
  it("allows Ready when SKU, image and a verified fact exist", () => {
    const values = valid({ status: "ready", variants: [{ ...blankVariant(), sku: "R-1" }], facts: [{ id: "f", label: "Chất liệu", value: "Tre", verified: true, evidence: "" }] });
    expect(issues(values, { assetCount: 1 })).toEqual([]);
  });
  it("does not treat an unverified fact as verified", () => {
    const values = valid({ status: "ready", variants: [{ ...blankVariant(), sku: "R-1" }], facts: [{ id: "f", label: "Chất liệu", value: "Tre", verified: false, evidence: "" }] });
    expect(issues(values, { assetCount: 1 }).find(i => i.path === "status")?.message).toMatch(/đặc tính đã xác minh/);
  });
  it("requires a label and value for every fact", () => {
    const found = issues(valid({ facts: [{ id: "f", label: "", value: "", verified: false, evidence: "" }] }));
    expect(found.map(i => i.path)).toEqual(expect.arrayContaining(["facts.0.label", "facts.0.value"]));
  });
});

describe("form value mapping", () => {
  it("round-trips a product through form values", () => {
    const product = seed().find(p => p.id === "sample-blanket")!;
    const form = productToFormValues(product);
    expect(form.variants).toHaveLength(3);
    expect(form.featuresText).toBe(product.features.join("\n"));
    expect(form.facts[0].verified).toBe(true);
  });
  it("parses feature lines", () => {
    expect(parseFeatures(" a \n\n b\n")).toEqual(["a", "b"]);
  });
});
