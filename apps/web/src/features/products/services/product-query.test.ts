import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY, countByCategory, getReadiness, isFiltered, matchesSearch, queryProducts } from "./product-query";
import { seed } from "../test-utils";

const products = seed();
const q = (patch: Partial<typeof DEFAULT_QUERY>) => queryProducts(products, { ...DEFAULT_QUERY, ...patch });

describe("product search", () => {
  it("matches name, internal code and variant SKU", () => {
    expect(q({ search: "Thanh Trúc" }).map(p => p.id)).toEqual(["sample-bamboo"]);
    expect(q({ search: "mh-160" }).map(p => p.id)).toEqual(["sample-cooling"]);
    expect(q({ search: "DN-200-DN" }).map(p => p.id)).toEqual(["sample-blanket"]);
  });
  it("ignores accents, case and the letter đ", () => {
    expect(matchesSearch(products.find(p => p.id === "sample-blanket")!, "dat nung")).toBe(true);
    expect(matchesSearch(products.find(p => p.id === "sample-blanket")!, "ĐẤT NUNG")).toBe(true);
  });
  it("requires every typed word and returns nothing for unknown terms", () => {
    expect(q({ search: "chiếu tre" })).toHaveLength(1);
    expect(q({ search: "không-có-sản-phẩm" })).toHaveLength(0);
  });
});

describe("product filters", () => {
  it("filters by category", () => {
    const rows = q({ category: "Chiếu mát" });
    expect(rows).toHaveLength(2);
    expect(rows.every(p => p.category === "Chiếu mát")).toBe(true);
  });
  it("filters by status", () => {
    expect(q({ status: "archived" }).map(p => p.id)).toEqual(["sample-bedding"]);
    expect(q({ status: "ready" }).every(p => p.status === "ready")).toBe(true);
  });
  it("combines search, category and status", () => {
    expect(q({ category: "Chiếu mát", status: "draft", search: "Lục" }).map(p => p.id)).toEqual(["sample-cooling-2"]);
    expect(q({ category: "Chiếu mát", status: "archived" })).toHaveLength(0);
  });
  it("reports whether any filter is active", () => {
    expect(isFiltered(DEFAULT_QUERY)).toBe(false);
    expect(isFiltered({ ...DEFAULT_QUERY, search: "  " })).toBe(false);
    expect(isFiltered({ ...DEFAULT_QUERY, category: "Gối" })).toBe(true);
  });
});

describe("product sorting", () => {
  it("sorts by last update, newest first by default", () => {
    const dates = q({}).map(p => p.updatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });
  it("sorts oldest first", () => {
    const dates = q({ sort: "updated-asc" }).map(p => p.updatedAt);
    expect(dates).toEqual([...dates].sort());
  });
  it("sorts by Vietnamese name in both directions", () => {
    const asc = q({ sort: "name-asc" }).map(p => p.name);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b, "vi")));
    expect(q({ sort: "name-desc" }).map(p => p.name)).toEqual([...asc].reverse());
  });
  it("sorts by code and does not mutate the input", () => {
    const before = products.map(p => p.id);
    const codes = q({ sort: "code-asc" }).map(p => p.code);
    expect(codes).toEqual([...codes].sort());
    expect(products.map(p => p.id)).toEqual(before);
  });
});

describe("readiness and summaries", () => {
  it("counts a product as ready only with SKU, image and a verified fact", () => {
    const full = products.find(p => p.id === "sample-cooling")!;
    expect(getReadiness(full).complete).toBe(true);
    expect(getReadiness({ ...full, assets: [] }).complete).toBe(false);
    expect(getReadiness({ ...full, variants: [] }).done).toBe(3);
    expect(getReadiness({ ...full, facts: full.facts.map(f => ({ ...f, verified: false })) }).complete).toBe(false);
  });
  it("counts products by category", () => {
    const counts = Object.fromEntries(countByCategory(products));
    expect(counts["Chiếu mát"]).toBe(2);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(products.length);
  });
  it("labels every seed record as sample data", () => {
    expect(products.every(p => p.isSample)).toBe(true);
  });
});
