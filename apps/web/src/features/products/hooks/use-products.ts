"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { productStore } from "../services/product-store";
import { assetStore } from "../services/asset-store";
import type { Product, ProductAsset } from "../types/product";

export function useProducts() {
  const state = useSyncExternalStore(productStore.subscribe, productStore.getSnapshot, productStore.getServerSnapshot);
  return { ...state, actions: productStore };
}

export function useProduct(id: string): { status: "loading" | "ready" | "error"; product: Product | undefined; error?: string } {
  const state = useProducts();
  if (state.status !== "ready") return { status: state.status, product: undefined, error: state.error };
  return { status: "ready", product: state.products.find(p => p.id === id) };
}

/**
 * Resolves displayable URLs for assets. Sample assets use their public path; local assets are
 * read from IndexedDB and exposed as object URLs that are revoked on change or unmount.
 */
export function useAssetUrls(assets: readonly ProductAsset[]): Record<string, string | null> {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const key = assets.map(a => a.id + ":" + a.source + ":" + a.url).join("|");
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    void (async () => {
      const next: Record<string, string | null> = {};
      for (const asset of assets) {
        if (asset.source === "sample") {
          next[asset.id] = asset.url;
          continue;
        }
        try {
          const blob = await assetStore.get(asset.id);
          if (blob && !cancelled) {
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[asset.id] = url;
          } else next[asset.id] = null;
        } catch {
          next[asset.id] = null;
        }
      }
      if (cancelled) created.forEach(url => URL.revokeObjectURL(url));
      else setUrls(next);
    })();
    return () => {
      cancelled = true;
      created.forEach(url => URL.revokeObjectURL(url));
    };
    // `key` captures every field of `assets` that affects the result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}
