import { z } from "zod";
import { createSeedProducts } from "../mock-data/seed";
import { productSchema, type Product, type ProductInput } from "../types/product";

export interface ProductListResult {
  products: Product[];
  /** set when stored data was unreadable and replaced by seed data */
  notice?: string;
}

/**
 * Data access boundary. UI code depends on this interface only, so the
 * localStorage implementation can later be replaced by a real API.
 */
export interface ProductRepository {
  listProducts(): Promise<ProductListResult>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  deleteProducts(ids: readonly string[]): Promise<void>;
  resetDemoData(): Promise<Product[]>;
}

export const STORAGE_KEY = "ecommerce-os:content-factory:products:v1";
const envelope = z.object({ version: z.literal(1), products: z.array(productSchema) });

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super("Không tìm thấy sản phẩm " + id + ".");
    this.name = "ProductNotFoundError";
  }
}

/**
 * Demo-only implementation. Limitations:
 * - data is stored per browser profile and is not shared between users or devices;
 * - localStorage is small (about 5 MB), so only product metadata is stored, never image bytes;
 * - there is no locking: two tabs editing at once resolve as last write wins.
 */
export function createLocalStorageProductRepository(storage: StorageLike, now: () => Date = () => new Date()): ProductRepository {
  let idCounter = 0;
  const makeId = () => {
    idCounter += 1;
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(now().getTime()) + "-" + idCounter;
    return "prod-" + random;
  };

  function persist(products: Product[]) {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, products }));
  }

  function load(): ProductListResult {
    let raw: string | null = null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      return { products: createSeedProducts(), notice: "Trình duyệt chặn bộ nhớ cục bộ. Thay đổi sẽ không được lưu." };
    }
    if (raw === null) {
      const products = createSeedProducts();
      try {
        persist(products);
      } catch {
        /* storage unavailable: keep seed in memory only */
      }
      return { products };
    }
    try {
      const parsed = envelope.safeParse(JSON.parse(raw));
      if (parsed.success) return { products: parsed.data.products };
    } catch {
      /* fall through to recovery */
    }
    const products = createSeedProducts();
    try {
      persist(products);
    } catch {
      /* ignore */
    }
    return { products, notice: "Dữ liệu demo trong trình duyệt bị hỏng nên đã được khôi phục về bộ mẫu." };
  }

  return {
    async listProducts() {
      return load();
    },
    async getProductById(id) {
      return load().products.find(p => p.id === id) ?? null;
    },
    async createProduct(input) {
      const { products } = load();
      const stamp = now().toISOString();
      const product: Product = { ...input, id: makeId(), isSample: false, createdAt: stamp, updatedAt: stamp };
      persist([product, ...products]);
      return product;
    },
    async updateProduct(id, input) {
      const { products } = load();
      const current = products.find(p => p.id === id);
      if (!current) throw new ProductNotFoundError(id);
      const next: Product = { ...current, ...input, id, isSample: current.isSample, createdAt: current.createdAt, updatedAt: now().toISOString() };
      persist(products.map(p => (p.id === id ? next : p)));
      return next;
    },
    async deleteProduct(id) {
      const { products } = load();
      if (!products.some(p => p.id === id)) throw new ProductNotFoundError(id);
      persist(products.filter(p => p.id !== id));
    },
    async deleteProducts(ids) {
      const drop = new Set(ids);
      persist(load().products.filter(p => !drop.has(p.id)));
    },
    async resetDemoData() {
      const products = createSeedProducts();
      persist(products);
      return products;
    }
  };
}
