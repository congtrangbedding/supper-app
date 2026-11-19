import { describe, expect, it } from "vitest";
import { createLocalStorageProductRepository, ProductNotFoundError, STORAGE_KEY } from "./product-repository";
import { MemoryStorage, makeInput, seed } from "../test-utils";

function setup() {
  const storage = new MemoryStorage();
  let tick = 0;
  const repo = createLocalStorageProductRepository(storage, () => new Date(Date.UTC(2026, 10, 20, 0, 0, tick++)));
  return { storage, repo };
}

describe("product repository", () => {
  it("seeds sample data on first read and persists it", async () => {
    const { repo, storage } = setup();
    const { products, notice } = await repo.listProducts();
    expect(products).toHaveLength(seed().length);
    expect(notice).toBeUndefined();
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("creates a product that is not marked as sample and appears first", async () => {
    const { repo } = setup();
    const created = await repo.createProduct(makeInput({ name: "Chiếu mới", code: "NEW-1" }));
    expect(created.isSample).toBe(false);
    expect(created.id).toMatch(/^prod-/);
    const { products } = await repo.listProducts();
    expect(products[0].id).toBe(created.id);
    expect(await repo.getProductById(created.id)).toEqual(created);
  });

  it("updates a product, keeping id, creation date and sample flag", async () => {
    const { repo } = setup();
    const created = await repo.createProduct(makeInput());
    const updated = await repo.updateProduct(created.id, makeInput({ name: "Tên mới", status: "ready" }));
    expect(updated.name).toBe("Tên mới");
    expect(updated.status).toBe("ready");
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt > created.updatedAt).toBe(true);
    expect((await repo.getProductById(created.id))?.name).toBe("Tên mới");
  });

  it("deletes one or many products", async () => {
    const { repo } = setup();
    const before = (await repo.listProducts()).products.length;
    await repo.deleteProduct("sample-rug");
    expect(await repo.getProductById("sample-rug")).toBeNull();
    await repo.deleteProducts(["sample-pillow", "sample-linen"]);
    expect((await repo.listProducts()).products).toHaveLength(before - 3);
  });

  it("rejects updating or deleting an unknown product", async () => {
    const { repo } = setup();
    await expect(repo.updateProduct("missing", makeInput())).rejects.toBeInstanceOf(ProductNotFoundError);
    await expect(repo.deleteProduct("missing")).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it("recovers from malformed stored data with a notice", async () => {
    const { repo, storage } = setup();
    storage.setItem(STORAGE_KEY, "{not json");
    const first = await repo.listProducts();
    expect(first.products).toHaveLength(seed().length);
    expect(first.notice).toMatch(/khôi phục/);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, products: [{ id: 1 }] }));
    expect((await repo.listProducts()).notice).toBeDefined();
    expect((await repo.listProducts()).notice).toBeUndefined();
  });

  it("resets to seed data", async () => {
    const { repo } = setup();
    await repo.createProduct(makeInput());
    await repo.deleteProduct("sample-rug");
    const products = await repo.resetDemoData();
    expect(products.map(p => p.id)).toEqual(seed().map(p => p.id));
    expect((await repo.listProducts()).products).toHaveLength(seed().length);
  });

  it("never stores image bytes or object URLs", async () => {
    const { repo, storage } = setup();
    await repo.createProduct(makeInput({ assets: [{ id: "a1", name: "x.png", size: 10, mimeType: "image/png", source: "local", url: "", isMain: true }] }));
    expect(storage.getItem(STORAGE_KEY)).not.toMatch(/blob:|data:image/);
  });
});
