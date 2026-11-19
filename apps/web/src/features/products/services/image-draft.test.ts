import { describe, expect, it } from "vitest";
import { moveImage, normalizeMain, removedPreviewUrls, removeImage, setMainImage, validateFiles, type ImageDraft } from "./image-draft";
import { ASSET_LIMITS } from "../types/product";

const file = (name: string, type = "image/png", size = 1000) => ({ name, type, size });
const draft = (id: string, isMain = false, previewUrl?: string): ImageDraft => ({ id, name: id, size: 1, mimeType: "image/png", source: "local", url: "", isMain, previewUrl });

describe("image validation", () => {
  it("accepts supported types within the size limit", () => {
    const { accepted, errors } = validateFiles([file("a.png"), file("b.jpg", "image/jpeg"), file("c.webp", "image/webp")], 0);
    expect(accepted).toHaveLength(3);
    expect(errors).toEqual([]);
  });
  it("rejects wrong types, oversized and empty files", () => {
    const { accepted, errors } = validateFiles([file("a.gif", "image/gif"), file("big.png", "image/png", ASSET_LIMITS.maxBytes + 1), file("empty.png", "image/png", 0), file("ok.png")], 0);
    expect(accepted.map(f => f.name)).toEqual(["ok.png"]);
    expect(errors).toHaveLength(3);
  });
  it("enforces the maximum number of images", () => {
    const { accepted, errors } = validateFiles([file("a.png"), file("b.png")], ASSET_LIMITS.maxFiles - 1);
    expect(accepted).toHaveLength(1);
    expect(errors[0]).toMatch(/tối đa/);
  });
});

describe("image list operations", () => {
  it("keeps exactly one main image", () => {
    expect(normalizeMain([draft("a"), draft("b")]).map(i => i.isMain)).toEqual([true, false]);
    expect(normalizeMain([draft("a"), draft("b", true)]).map(i => i.isMain)).toEqual([false, true]);
    expect(normalizeMain([])).toEqual([]);
  });
  it("changes the main image", () => {
    expect(setMainImage([draft("a", true), draft("b")], "b").map(i => i.isMain)).toEqual([false, true]);
  });
  it("promotes another image when the main one is removed", () => {
    const next = removeImage([draft("a", true), draft("b")], "a");
    expect(next.map(i => [i.id, i.isMain])).toEqual([["b", true]]);
    expect(removeImage([draft("a", true)], "a")).toEqual([]);
  });
  it("reorders images and ignores invalid moves", () => {
    const list = [draft("a"), draft("b"), draft("c")];
    expect(moveImage(list, 0, 2).map(i => i.id)).toEqual(["b", "c", "a"]);
    expect(moveImage(list, 2, 1).map(i => i.id)).toEqual(["a", "c", "b"]);
    expect(moveImage(list, 0, 5).map(i => i.id)).toEqual(["a", "b", "c"]);
  });
  it("lists object URLs to revoke for removed images only", () => {
    const before = [draft("a", true, "blob:1"), draft("b", false, "blob:2"), draft("c")];
    expect(removedPreviewUrls(before, [before[0]])).toEqual(["blob:2"]);
  });
});
