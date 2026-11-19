"use client";
import { useSyncExternalStore } from "react";
import { productionStore } from "../services/production-store";

export function useProductionFlows() {
  const state = useSyncExternalStore(productionStore.subscribe, productionStore.getSnapshot, productionStore.getServerSnapshot);
  return { ...state, actions: productionStore };
}
