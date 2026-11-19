import type { Product } from "@/features/products/types/product";
import { toRow } from "./flow-model";
import {
  createLocalStorageProductionRepository,
  FLOW_STORAGE_KEY,
  type BulkResult,
  type CreateFlowsResult,
  type FlowPatch,
  type NewFlowInput,
  type ProductionRepository
} from "./production-repository";
import { createSimulationRunner, type Scheduler, type SimulationOutcome } from "./simulation";
import { FLOW_STATUS_LABELS, type FlowConfig, type FlowStatus, type ProductionFlow, type RunEntry } from "../types/production";

export type ProductionState =
  | { status: "loading"; flows: ProductionFlow[]; progress: Record<string, number>; notice?: undefined; error?: undefined }
  | { status: "ready"; flows: ProductionFlow[]; progress: Record<string, number>; notice?: string; error?: undefined }
  | { status: "error"; flows: ProductionFlow[]; progress: Record<string, number>; notice?: undefined; error: string };

const LOADING: ProductionState = { status: "loading", flows: [], progress: {} };

export interface StartResult {
  started: string[];
  skipped: { id: string; reason: string }[];
}

const STARTABLE: readonly FlowStatus[] = ["DRAFT", "READY", "DEMO_FAILED", "CANCELLED"];

/**
 * Shared client store for production flows. Wraps a ProductionRepository and owns the (in-memory) simulation timers.
 * Progress is never persisted; only start and end of a run are written, so a reload cannot resume a simulation.
 */
export function createProductionStore(
  getRepository: () => ProductionRepository,
  options: { scheduler?: Scheduler; intervalMs?: number; fails?: (flowId: string, attempt: number) => boolean; now?: () => Date } = {}
) {
  const now = options.now ?? (() => new Date());
  let state: ProductionState = LOADING;
  let started = false;
  const listeners = new Set<() => void>();
  const startedAt = new Map<string, string>();
  let seq = 0;

  const emit = (next: ProductionState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const withProgress = (progress: Record<string, number>) => emit({ ...state, progress } as ProductionState);

  async function refresh(recover = false) {
    try {
      const repo = getRepository();
      // read first so a recovery notice (corrupted data) is not swallowed by the recovery pass
      const first = await repo.listFlows();
      if (recover) await repo.recoverInterrupted();
      const { flows, notice } = recover ? await repo.listFlows() : first;
      emit({ status: "ready", flows, notice: first.notice ?? notice, progress: state.progress });
    } catch (error) {
      emit({ status: "error", flows: [], progress: {}, error: error instanceof Error ? error.message : "Không đọc được dữ liệu flow." });
    }
  }

  function runEntry(flowId: string, outcome: RunEntry["outcome"], note: string): RunEntry {
    seq += 1;
    return { id: "run-" + now().getTime() + "-" + seq, startedAt: startedAt.get(flowId) ?? now().toISOString(), endedAt: now().toISOString(), outcome, note };
  }

  async function finish(flowId: string, outcome: SimulationOutcome, note: string) {
    const status: FlowStatus = outcome === "completed" ? "DEMO_COMPLETED" : outcome === "failed" ? "DEMO_FAILED" : "CANCELLED";
    const progress = { ...state.progress };
    delete progress[flowId];
    state = { ...state, progress } as ProductionState;
    try {
      await getRepository().updateFlow(flowId, { status, run: runEntry(flowId, outcome, note) });
    } catch {
      /* flow was deleted meanwhile */
    }
    startedAt.delete(flowId);
    await refresh();
  }

  const runner = createSimulationRunner({
    scheduler: options.scheduler,
    intervalMs: options.intervalMs,
    fails: options.fails,
    onProgress: (id, step) => withProgress({ ...state.progress, [id]: step }),
    onFinish: (id, outcome, note) => void finish(id, outcome, note)
  });

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === FLOW_STORAGE_KEY) void refresh();
  };

  async function interruptSimulations(note = "Mô phỏng dừng vì bạn rời khỏi trang.") {
    const ids = runner.stopAll();
    if (ids.length === 0) return;
    const repo = getRepository();
    await Promise.all(ids.map(id => repo.updateFlow(id, { status: "DEMO_FAILED", run: runEntry(id, "interrupted", note) }).catch(() => undefined)));
    ids.forEach(id => startedAt.delete(id));
    state = { ...state, progress: {} } as ProductionState;
    await refresh();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!started) {
        started = true;
        void refresh(true);
        if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => LOADING,
    refresh: () => refresh(),
    isRunning: (id: string) => runner.isRunning(id),

    async createFlows(inputs: readonly NewFlowInput[], config: FlowConfig, opts?: { allowDuplicates?: boolean }): Promise<CreateFlowsResult> {
      const result = await getRepository().createFlows(inputs, config, opts);
      await refresh();
      return result;
    },
    async updateFlow(id: string, patch: FlowPatch) {
      const flow = await getRepository().updateFlow(id, patch);
      await refresh();
      return flow;
    },
    async duplicate(ids: readonly string[]) {
      const repo = getRepository();
      const copies: ProductionFlow[] = [];
      for (const id of ids) copies.push(await repo.duplicateFlow(id));
      await refresh();
      return copies;
    },
    async remove(ids: readonly string[]) {
      ids.forEach(id => {
        runner.cancel(id);
        startedAt.delete(id);
      });
      await getRepository().deleteFlows(ids);
      await refresh();
    },
    async bulkUpdate(ids: readonly string[], patch: FlowPatch): Promise<BulkResult> {
      const result = await getRepository().bulkUpdateFlows(ids, patch);
      await refresh();
      return result;
    },

    /** Starts the simulation for flows that are READY, failed or cancelled and whose product data is complete. */
    async start(ids: readonly string[], products: readonly Product[]): Promise<StartResult> {
      const repo = getRepository();
      const result: StartResult = { started: [], skipped: [] };
      for (const id of ids) {
        const flow = state.flows.find(f => f.id === id);
        if (!flow) {
          result.skipped.push({ id, reason: "Không tìm thấy flow." });
          continue;
        }
        const row = toRow(flow, products);
        if (runner.isRunning(id) || flow.status === "SIMULATING") {
          result.skipped.push({ id, reason: "Đang mô phỏng." });
        } else if (!STARTABLE.includes(flow.status)) {
          result.skipped.push({ id, reason: "Trạng thái “" + FLOW_STATUS_LABELS[flow.status] + "” cần được đặt lại trước khi chạy lại." });
        } else if (row.blockers.length > 0) {
          result.skipped.push({ id, reason: row.blockers.join("; ") });
        } else {
          const attempt = flow.attempts + 1;
          await repo.updateFlow(id, { status: "SIMULATING", attempts: attempt });
          startedAt.set(id, now().toISOString());
          runner.start(id, attempt);
          result.started.push(id);
        }
      }
      if (result.started.length > 0) {
        const progress = { ...state.progress };
        result.started.forEach(id => (progress[id] ??= 0));
        state = { ...state, progress } as ProductionState;
      }
      await refresh();
      return result;
    },
    cancel: (id: string) => runner.cancel(id),
    /** Back to READY for finished flows; running flows are skipped. */
    async reset(ids: readonly string[]) {
      const targets = ids.filter(id => !runner.isRunning(id));
      const result = await getRepository().bulkUpdateFlows(targets, { status: "READY" });
      await refresh();
      return result;
    },
    async resetAll() {
      runner.stopAll();
      state = { ...state, progress: {} } as ProductionState;
      await getRepository().resetDemoFlows();
      await refresh();
    },
    interruptSimulations
  };
}

export type ProductionStore = ReturnType<typeof createProductionStore>;

let repository: ProductionRepository | undefined;
export const productionStore: ProductionStore = createProductionStore(() => {
  repository ??= createLocalStorageProductionRepository(window.localStorage);
  return repository;
});
