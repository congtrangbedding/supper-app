import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activeSlug, allFactoryItems, factoryCrumbs, factoryHref, factoryNavGroups, findFactoryItem, legacyRedirects, SOON_SLUGS, slugFromPath } from "./navigation";
import { getDestination } from "@/lib/workspace";

const appDir = (...parts: string[]) => fileURLToPath(new URL("../../app/content/" + parts.join("/"), import.meta.url));

describe("AI Content Factory navigation", () => {
  it("contains the required groups and destinations in order", () => {
    expect(factoryNavGroups.map(g => g.label)).toEqual(["Tổng quan", "Sản phẩm", "Image Factory", "Video Factory", "Vận hành", "Cài đặt"]);
    expect(allFactoryItems.map(i => i.title)).toEqual([
      "Dashboard", "Danh sách sản phẩm", "Thêm sản phẩm",
      "Xưởng sản xuất ảnh", "Dự án ảnh", "Image Editor", "Kho Templates ảnh",
      "Xưởng sản xuất video", "Dự án video", "Storyboard Editor", "Kho Templates video",
      "Media Library", "Batch Production", "Render Jobs", "Duyệt nội dung", "Hàng đợi đăng bài",
      "Brand Kit", "AI Settings"
    ]);
  });
  it("has unique slugs", () => {
    const slugs = allFactoryItems.map(i => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("only marks Dashboard, Product Studio and Image Production routes as ready", () => {
    expect(allFactoryItems.filter(i => i.status === "ready").map(i => i.slug)).toEqual(["dashboard", "products", "products/new", "images/production"]);
  });
  it("backs every ready route with a page and every other route with the placeholder", () => {
    expect(existsSync(appDir("dashboard", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("products", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("products", "new", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("products", "[id]", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("products", "[id]", "edit", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("images", "production", "page.tsx"))).toBe(true);
    expect(existsSync(appDir("[...slug]", "page.tsx"))).toBe(true);
    for (const slug of SOON_SLUGS) expect(existsSync(appDir(...slug.split("/"), "page.tsx")), slug).toBe(false);
  });
  it("builds /content hrefs and resolves slugs from paths", () => {
    expect(factoryHref("products/new")).toBe("/content/products/new");
    expect(slugFromPath("/content/images/editor/")).toBe("images/editor");
    expect(findFactoryItem("nope")).toBeUndefined();
  });
  it("highlights the right item, including dynamic product routes", () => {
    expect(activeSlug("/content/dashboard")).toBe("dashboard");
    expect(activeSlug("/content/products")).toBe("products");
    expect(activeSlug("/content/products/abc")).toBe("products");
    expect(activeSlug("/content/products/abc/edit")).toBe("products");
    expect(activeSlug("/content/products/new")).toBe("products/new");
    expect(activeSlug("/content/jobs")).toBe("jobs");
    expect(activeSlug("/content/images/production")).toBe("images/production");
    expect(activeSlug("/content/unknown")).toBeUndefined();
  });
  it("redirects legacy paths to existing destinations", () => {
    for (const [from, to] of Object.entries(legacyRedirects)) {
      expect(getDestination(from), from).toBeDefined();
      expect(findFactoryItem(to), to).toBeDefined();
    }
  });
  it("builds breadcrumbs", () => {
    expect(factoryCrumbs("dashboard")).toEqual([{ label: "AI Content Factory", href: "/content/dashboard" }, { label: "Dashboard" }]);
    expect(factoryCrumbs("products").map(c => c.label)).toEqual(["AI Content Factory", "Sản phẩm", "Danh sách sản phẩm"]);
    const detail = factoryCrumbs("products", [{ label: "Chiếu A" }]);
    expect(detail.map(c => c.label)).toEqual(["AI Content Factory", "Sản phẩm", "Danh sách sản phẩm", "Chiếu A"]);
    expect(detail[2].href).toBe("/content/products");
  });
});
