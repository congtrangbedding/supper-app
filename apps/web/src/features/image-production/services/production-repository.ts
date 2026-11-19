import { z } from "zod";
import type { StorageLike } from "@/features/products/services/product-repository";
import { validateConfig } from "./flow-model";
import { flowSchema, MAX_FLOWS, MAX_RUNS_PER_FLOW, type FlowConfig, type FlowSnapshot, type FlowStatus, type ProductionFlow, type RunEntry } from "../types/production";

export const FLOW_STORAGE_KEY = "ecommerce-os:content-factory:production-flows:v1";
const envelope = z.object({ version: z.literal(1), flows: z.array(z.unknown()) });

export interface NewFlowInput {
  productId: string;
  variantId?: string;
  snapshot: FlowSnapshot;
}

export interface FlowPatch {
  config?: Partial<FlowConfig>;
  status?: FlowStatus;
  attempts?: number;
  /** appended to the run history (oldest entries are dropped beyond the cap) */
  run?: RunEntry;
}

export interface FlowListResult {
  flows: ProductionFlow[];
  /** set when stored data was unreadable or partly dropped */
  notice?: string;
}
export interface CreateFlowsResult {
  created: ProductionFlow[];
  /** targets that already have a flow and were not created because duplicates were not confirmed */
  duplicates: NewFlowInput[];
  /** targets not created because the flow limit was reached */
  overLimit: NewFlowInput[];
}
export interface BulkResult {
  updated: ProductionFlow[];
  skipped: { id: string; reason: string }[];
}

/** Data access boundary for production flows. Separate from ProductRepository; stores only references and snapshots. */
export interface ProductionRepository {
  listFlows(): Promise<FlowListResult>;
  getFlowById(id: string): Promise<ProductionFlow | null>;
  createFlows(inputs: readonly NewFlowInput[], config: FlowConfig, options?: { allowDuplicates?: boolean }): Promise<CreateFlowsResult>;
  updateFlow(id: string, patch: FlowPatch): Promise<ProductionFlow>;
  duplicateFlow(id: string): Promise<ProductionFlow>;
  deleteFlow(id: string): Promise<void>;
  deleteFlows(ids: readonly string[]): Promise<void>;
  bulkUpdateFlows(ids: readonly string[], patch: FlowPatch): Promise<BulkResult>;
  /** Puts every flow back to READY and clears run history. Does not delete flows. */
  resetDemoFlows(): Promise<ProductionFlow[]>;
  /** Flows left SIMULATING by a closed page become DEMO_FAILED (interrupted). */
  recoverInterrupted(): Promise<ProductionFlow[]>;
}

export class FlowNotFoundError extends Error {
  constructor(id: string) {
    super("Không tìm thấy flow " + id + ".");
    this.name = "FlowNotFoundError";
  }
}
export class FlowValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join(" "));
    this.name = "FlowValidationError";
  }
}
export class FlowLockedError extends Error {
  constructor() {
    super("Flow đang mô phỏng. Hãy hủy mô phỏng trước khi sửa cấu hình.");
    this.name = "FlowLockedError";
  }
}

const RESETTABLE: readonly FlowStatus[] = ["DEMO_COMPLETED", "DEMO_FAILED", "CANCELLED"];

/**
 * Demo implementation on localStorage. Limits: per browser profile, about 5 MB shared with other keys, last write wins
 * between tabs, at most MAX_FLOWS flows and MAX_RUNS_PER_FLOW history entries per flow. No image bytes or object URLs are stored.
 */
export function createLocalStorageProductionRepository(storage: StorageLike, now: () => Date = () => new Date()): ProductionRepository {
  let counter = 0;
  const makeId = (prefix: string) => {
    counter += 1;
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(now().getTime()) + "-" + counter;
    return prefix + "-" + random;
  };
  const stamp = () => now().toISOString();
  const persist = (flows: ProductionFlow[]) => storage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ version: 1, flows }));

  function load(): FlowListResult {
    let raw: string | null;
    try {
      raw = storage.getItem(FLOW_STORAGE_KEY);
    } catch {
      return { flows: [], notice: "Trình duyệt chặn bộ nhớ cục bộ. Flow sẽ không được lưu." };
    }
    if (raw === null) return { flows: [] };
    try {
      const parsed = envelope.safeParse(JSON.parse(raw));
      if (parsed.success) {
        const flows: ProductionFlow[] = [];
        for (const item of parsed.data.flows) {
          const result = flowSchema.safeParse(item);
          if (result.success) flows.push(result.data);
        }
        const dropped = parsed.data.flows.length - flows.length;
        const capped = flows.slice(0, MAX_FLOWS);
        const notice = dropped > 0 ? dropped + " flow có dữ liệu hỏng đã bị bỏ qua." : undefined;
        if (dropped > 0) {
          try {
            persist(capped);
          } catch {
            /* keep in memory */
          }
        }
        return { flows: capped, notice };
      }
    } catch {
      /* fall through */
    }
    try {
      persist([]);
    } catch {
      /* ignore */
    }
    return { flows: [], notice: "Dữ liệu flow trong trình duyệt bị hỏng nên đã được đặt lại về trống." };
  }

  function apply(flow: ProductionFlow, patch: FlowPatch): ProductionFlow {
    if (flow.status === "SIMULATING" && patch.config) throw new FlowLockedError();
    let config = flow.config;
    let status = patch.status ?? flow.status;
    if (patch.config) {
      config = { ...flow.config, ...patch.config };
      const errors = validateConfig(config);
      if (errors.length > 0) throw new FlowValidationError(errors);
      // a finished run no longer describes the new configuration
      if (!patch.status && RESETTABLE.includes(flow.status)) status = "READY";
    }
    const runs = patch.run ? [...flow.runs, patch.run].slice(-MAX_RUNS_PER_FLOW) : flow.runs;
    return { ...flow, config, status, runs, attempts: patch.attempts ?? flow.attempts, updatedAt: stamp() };
  }

  return {
    async listFlows() {
      return load();
    },
    async getFlowById(id) {
      return load().flows.find(f => f.id === id) ?? null;
    },
    async createFlows(inputs, config, options = {}) {
      const errors = validateConfig(config);
      if (errors.length > 0) throw new FlowValidationError(errors);
      const { flows } = load();
      const existing = new Set(flows.map(f => f.productId + "::" + (f.variantId ?? "")));
      const created: ProductionFlow[] = [];
      const duplicates: NewFlowInput[] = [];
      const overLimit: NewFlowInput[] = [];
      const seenInBatch = new Set<string>();
      for (const input of inputs) {
        const key = input.productId + "::" + (input.variantId ?? "");
        if (seenInBatch.has(key)) continue; // same target twice in one submit is always a mistake
        seenInBatch.add(key);
        if (existing.has(key) && !options.allowDuplicates) {
          duplicates.push(input);
          continue;
        }
        if (flows.length + created.length >= MAX_FLOWS) {
          overLimit.push(input);
          continue;
        }
        const time = stamp();
        created.push({
          id: makeId("flow"),
          productId: input.productId,
          variantId: input.variantId,
          snapshot: input.snapshot,
          config: { ...config, slots: config.slots.map(s => ({ ...s })) },
          status: "READY",
          attempts: 0,
          runs: [],
          createdAt: time,
          updatedAt: time
        });
      }
      if (created.length > 0) persist([...created, ...flows]);
      return { created, duplicates, overLimit };
    },
    async updateFlow(id, patch) {
      const { flows } = load();
      const current = flows.find(f => f.id === id);
      if (!current) throw new FlowNotFoundError(id);
      const next = apply(current, patch);
      persist(flows.map(f => (f.id === id ? next : f)));
      return next;
    },
    async duplicateFlow(id) {
      const { flows } = load();
      const source = flows.find(f => f.id === id);
      if (!source) throw new FlowNotFoundError(id);
      if (flows.length >= MAX_FLOWS) throw new Error("Đã đạt giới hạn " + MAX_FLOWS + " flow. Hãy xóa bớt trước khi nhân bản.");
      const time = stamp();
      const copy: ProductionFlow = {
        ...source,
        id: makeId("flow"),
        config: { ...source.config, slots: source.config.slots.map(s => ({ ...s })) },
        status: "READY",
        attempts: 0,
        runs: [],
        createdAt: time,
        updatedAt: time
      };
      persist([copy, ...flows]);
      return copy;
    },
    async deleteFlow(id) {
      const { flows } = load();
      if (!flows.some(f => f.id === id)) throw new FlowNotFoundError(id);
      persist(flows.filter(f => f.id !== id));
    },
    async deleteFlows(ids) {
      const drop = new Set(ids);
      persist(load().flows.filter(f => !drop.has(f.id)));
    },
    async bulkUpdateFlows(ids, patch) {
      const { flows } = load();
      const wanted = new Set(ids);
      const updated: ProductionFlow[] = [];
      const skipped: BulkResult["skipped"] = [];
      const next = flows.map(flow => {
        if (!wanted.has(flow.id)) return flow;
        try {
          const result = apply(flow, patch);
          updated.push(result);
          return result;
        } catch (error) {
          skipped.push({ id: flow.id, reason: error instanceof Error ? error.message : "Không cập nhật được." });
          return flow;
        }
      });
      if (updated.length > 0) persist(next);
      return { updated, skipped };
    },
    async resetDemoFlows() {
      const time = stamp();
      const next = load().flows.map(f => (f.status === "DRAFT" ? f : { ...f, status: "READY" as const, attempts: 0, runs: [], updatedAt: time }));
      persist(next);
      return next;
    },
    async recoverInterrupted() {
      const { flows } = load();
      if (!flows.some(f => f.status === "SIMULATING")) return flows;
      const time = stamp();
      const next = flows.map(f =>
        f.status === "SIMULATING"
          ? {
              ...f,
              status: "DEMO_FAILED" as const,
              runs: [...f.runs, { id: makeId("run"), startedAt: f.updatedAt, endedAt: time, outcome: "interrupted" as const, note: "Mô phỏng bị gián đoạn do trang đã đóng hoặc tải lại." }].slice(-MAX_RUNS_PER_FLOW),
              updatedAt: time
            }
          : f
      );
      persist(next);
      return next;
    }
  };
}
