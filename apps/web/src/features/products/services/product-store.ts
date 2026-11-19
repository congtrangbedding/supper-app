import { createLocalStorageProductRepository, STORAGE_KEY, type ProductRepository } from "./product-repository";
import { assetStore } from "./asset-store";
import type { Product, ProductInput } from "../types/product";

export type ProductStoreState =
  | { status: "loading"; products: Product[]; notice?: undefined; error?: undefined }
  | { status: "ready"; products: Product[]; notice?: string; error?: undefined }
  | { status: "error"; products: Product[]; notice?: undefined; error: string };

export const LOADING: ProductStoreState = { status: "loading", products: [] };

/**
 * Shared client store so the library, detail page and dashboard always show the same data.
 * It wraps a ProductRepository; tests can create their own store with a fake repository.
 */
export function createProductStore(getRepository: () => ProductRepository, blobs: Pick<typeof assetStore, "remove" | "clear"> = assetStore) {
  let state: ProductStoreState = LOADING;
  let started = false;
  const listeners = new Set<() => void>();
  const emit = (next: ProductStoreState) => {
    state = next;
    listeners.forEach(listener => listener());
  };

  async function refresh() {
    try {
      const { products, notice } = await getRepository().listProducts();
      emit({ status: "ready", products, notice });
    } catch (error) {
      emit({ status: "error", products: [], error: error instanceof Error ? error.message : "Không đọc được dữ liệu demo." });
    }
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) void refresh();
  };

  async function localAssetIds(ids: readonly string[]) {
    const { products } = await getRepository().listProducts();
    return products.filter(p => ids.includes(p.id)).flatMap(p => p.assets.filter(a => a.source === "local").map(a => a.id));
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!started) {
        started = true;
        void refresh();
        if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => LOADING,
    refresh,
    async create(input: ProductInput) {
      const product = await getRepository().createProduct(input);
      await refresh();
      return product;
    },
    async update(id: string, input: ProductInput, removedAssetIds: readonly string[] = []) {
      const product = await getRepository().updateProduct(id, input);
      await blobs.remove(removedAssetIds).catch(() => undefined);
      await refresh();
      return product;
    },
    async remove(ids: readonly string[]) {
      const assetIds = await localAssetIds(ids);
      await getRepository().deleteProducts(ids);
      await blobs.remove(assetIds).catch(() => undefined);
      await refresh();
    },
    async reset() {
      await getRepository().resetDemoData();
      await blobs.clear().catch(() => undefined);
      await refresh();
    }
  };
}

export type ProductStore = ReturnType<typeof createProductStore>;

let repository: ProductRepository | undefined;
export const productStore: ProductStore = createProductStore(() => {
  repository ??= createLocalStorageProductRepository(window.localStorage);
  return repository;
});
