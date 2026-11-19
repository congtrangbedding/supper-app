import { createSeedProducts } from "./mock-data/seed";
import type { StorageLike } from "./services/product-repository";
import type { Product, ProductInput } from "./types/product";

export class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

export const seed = (): Product[] => createSeedProducts();

export function makeInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "Chiếu thử nghiệm",
    code: "TEST-1",
    category: "Chiếu mát",
    brand: "",
    description: "",
    material: "",
    color: "",
    pattern: "",
    dimensions: "",
    features: [],
    notes: "",
    facts: [],
    variants: [],
    assets: [],
    status: "draft",
    ...overrides
  };
}
