import { describe, expect, it, vi } from "vitest";
import { createLocalStorageProductRepository } from "./product-repository";
import { createProductStore } from "./product-store";
import { MemoryStorage, makeInput } from "../test-utils";

function setup() {
  const repo = createLocalStorageProductRepository(new MemoryStorage());
  const blobs = { remove: vi.fn(async () => undefined), clear: vi.fn(async () => undefined) };
  const store = createProductStore(() => repo, blobs);
  return { store, blobs };
}
const ready = async (store: ReturnType<typeof setup>["store"]) => {
  const notify = vi.fn();
  const unsubscribe = store.subscribe(notify);
  await vi.waitFor(() => expect(store.getSnapshot().status).toBe("ready"));
  return { notify, unsubscribe };
};

describe("product store", () => {
  it("starts loading, then exposes products to every subscriber", async () => {
    const { store } = setup();
    expect(store.getSnapshot().status).toBe("loading");
    expect(store.getServerSnapshot().status).toBe("loading");
    const { unsubscribe } = await ready(store);
    expect(store.getSnapshot().products.length).toBeGreaterThan(0);
    unsubscribe();
  });

  it("notifies subscribers and updates the snapshot after create, update and remove", async () => {
    const { store, blobs } = setup();
    const { notify, unsubscribe } = await ready(store);
    const created = await store.create(makeInput({ name: "A", code: "A-1", assets: [{ id: "img-1", name: "a.png", size: 5, mimeType: "image/png", source: "local", url: "", isMain: true }] }));
    expect(store.getSnapshot().products.some(p => p.id === created.id)).toBe(true);
    await store.update(created.id, makeInput({ name: "B", code: "A-1" }), ["img-1"]);
    expect(store.getSnapshot().products.find(p => p.id === created.id)?.name).toBe("B");
    expect(blobs.remove).toHaveBeenCalledWith(["img-1"]);
    await store.remove([created.id]);
    expect(store.getSnapshot().products.some(p => p.id === created.id)).toBe(false);
    expect(notify).toHaveBeenCalled();
    unsubscribe();
  });

  it("deletes stored image blobs of removed local assets only", async () => {
    const { store, blobs } = setup();
    const { unsubscribe } = await ready(store);
    const created = await store.create(
      makeInput({
        code: "B-1",
        assets: [
          { id: "local-1", name: "l.png", size: 5, mimeType: "image/png", source: "local", url: "", isMain: true },
          { id: "sample-1", name: "s.jpg", size: 0, mimeType: "image/jpeg", source: "sample", url: "/content/rug.jpg", isMain: false }
        ]
      })
    );
    await store.remove([created.id]);
    expect(blobs.remove).toHaveBeenLastCalledWith(["local-1"]);
    unsubscribe();
  });

  it("resets to sample data and clears stored images", async () => {
    const { store, blobs } = setup();
    const { unsubscribe } = await ready(store);
    await store.create(makeInput({ code: "C-1" }));
    await store.reset();
    expect(store.getSnapshot().products.every(p => p.isSample)).toBe(true);
    expect(blobs.clear).toHaveBeenCalled();
    unsubscribe();
  });

  it("reports an error state when the repository fails", async () => {
    const store = createProductStore(() => ({ ...createLocalStorageProductRepository(new MemoryStorage()), listProducts: () => Promise.reject(new Error("hỏng")) }));
    const unsubscribe = store.subscribe(() => undefined);
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe("error"));
    expect(store.getSnapshot().error).toBe("hỏng");
    unsubscribe();
  });
});
