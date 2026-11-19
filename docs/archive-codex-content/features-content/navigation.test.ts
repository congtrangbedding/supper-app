import { describe, expect, it } from "vitest";
import { groups, legacy, studioTitle } from "./navigation";
import { getDestination } from "@/lib/workspace";

const studioRoutes = groups.flatMap(([, items]) => items.map(([href]) => href as string));

describe("content studio navigation", () => {
  it("has unique routes", () => {
    expect(new Set(studioRoutes).size).toBe(studioRoutes.length);
  });
  it("redirects every legacy path to an existing studio route", () => {
    for (const [from, to] of Object.entries(legacy)) {
      expect(getDestination(from), from).toBeDefined();
      expect(studioRoutes, from).toContain(to);
    }
  });
  it("resolves titles for listed, dynamic and unknown routes", () => {
    expect(studioTitle("/content/dashboard")).toBe("Bảng điều khiển");
    expect(studioTitle("/content/products/cooling")).toBe("Chi tiết sản phẩm");
    expect(studioTitle("/content/products/cooling/edit")).toBe("Sửa sản phẩm");
    expect(studioTitle("/content/images/other/editor")).toBe("Trình sửa ảnh");
    expect(studioTitle("/content/unknown")).toBe("AI Content Factory");
  });
});
