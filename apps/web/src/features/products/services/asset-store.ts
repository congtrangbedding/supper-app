/**
 * Browser-only store for images the user picks while creating a product.
 * Bytes live in IndexedDB (database "ecommerce-os-demo") and are bounded by ASSET_LIMITS
 * (8 files of at most 3 MB per product). Product records keep metadata only.
 * Demo storage: cleared with site data, not shared between devices.
 */
export interface AssetBlobStore {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
  remove(ids: readonly string[]): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "ecommerce-os-demo";
const STORE = "product-assets";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB không khả dụng."));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không mở được IndexedDB."));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error ?? new Error("Lỗi IndexedDB."));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB bị hủy."));
    });
  } finally {
    db.close();
  }
}

export const assetStore: AssetBlobStore = {
  async put(id, blob) {
    await run("readwrite", store => store.put(blob, id));
  },
  async get(id) {
    return ((await run<Blob | undefined>("readonly", store => store.get(id) as IDBRequest<Blob | undefined>)) ?? null) as Blob | null;
  },
  async remove(ids) {
    if (!ids.length) return;
    await run("readwrite", store => {
      for (const id of ids) store.delete(id);
    });
  },
  async clear() {
    await run("readwrite", store => store.clear());
  }
};
