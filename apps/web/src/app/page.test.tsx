import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { applications, destinations, getDestination } from "@/lib/workspace";
import Home from "./page";

describe("workspace shell", () => {
  it("renders all five application links and their actual availability", () => {
    const html = renderToStaticMarkup(<Home/>);
    expect(applications).toHaveLength(5);
    for (const app of applications) expect(html).toContain('href="/' + app.slug + '"');
    expect(html.match(/Coming soon/g)).toHaveLength(4);
    expect(html).toContain('href="/content-factory/image-studio"');
  });
  it("resolves every destination uniquely and rejects unknown paths", () => {
    expect(new Set(destinations.map(page => page.path)).size).toBe(destinations.length);
    for (const page of destinations) expect(getDestination(page.path)).toBe(page);
    expect(getDestination("unknown")).toBeUndefined();
  });
  it("allows consumers to override shared component spacing", () => {
    expect(cn("p-4", false, "p-2")).toBe("p-2");
  });
});
