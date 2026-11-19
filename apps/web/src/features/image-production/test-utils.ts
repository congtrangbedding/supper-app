import { MemoryStorage, seed } from "@/features/products/test-utils";
import type { Product } from "@/features/products/types/product";
import { defaultConfig, snapshotFor } from "./services/flow-model";
import { createLocalStorageProductionRepository, type NewFlowInput } from "./services/production-repository";
import type { Scheduler } from "./services/simulation";

export { MemoryStorage, seed };

/** Manual clock: `tick()` runs every active interval once. */
export function fakeScheduler() {
  const handles = new Map<number, () => void>();
  let next = 1;
  const scheduler: Scheduler = {
    setInterval: handler => {
      handles.set(next, handler);
      return next++;
    },
    clearInterval: handle => void handles.delete(handle as number)
  };
  return {
    scheduler,
    tick(times = 1) {
      for (let i = 0; i < times; i++) [...handles.values()].forEach(h => h());
    },
    get active() {
      return handles.size;
    }
  };
}

export function inputFor(product: Product, variantIndex?: number): NewFlowInput {
  const variant = variantIndex === undefined ? undefined : product.variants[variantIndex];
  return { productId: product.id, variantId: variant?.id, snapshot: snapshotFor(product, variant) };
}

export function makeRepo(storage = new MemoryStorage()) {
  let t = 0;
  const repo = createLocalStorageProductionRepository(storage, () => new Date(Date.UTC(2026, 0, 1, 0, 0, t++)));
  return { repo, storage };
}

export const config = defaultConfig;
export const byId = (products: Product[], id: string) => products.find(p => p.id === id)!;
