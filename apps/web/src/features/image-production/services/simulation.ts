import { SLOT_COUNT } from "../types/production";

export interface Scheduler {
  setInterval(handler: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

export const browserScheduler: Scheduler = {
  setInterval: (handler, ms) => globalThis.setInterval(handler, ms),
  clearInterval: handle => globalThis.clearInterval(handle as ReturnType<typeof setInterval>)
};

export type SimulationOutcome = "completed" | "failed" | "cancelled";

/** Step at which a failing demo run stops (out of SLOT_COUNT). */
export const FAIL_AT_STEP = 6;

/**
 * Deterministic demo behaviour: about one flow in five fails on its FIRST attempt, so that "Retry" has something to show.
 * Any later attempt succeeds. The outcome depends only on the flow id and attempt number.
 */
export function shouldFailDemo(flowId: string, attempt: number) {
  if (attempt !== 1) return false;
  let sum = 0;
  for (const ch of flowId) sum += ch.charCodeAt(0);
  return sum % 5 === 0;
}

export interface SimulationRunner {
  start(flowId: string, attempt: number): boolean;
  cancel(flowId: string): boolean;
  isRunning(flowId: string): boolean;
  /** Clears every timer without reporting an outcome. Returns the ids that were running. */
  stopAll(): string[];
}

/**
 * Frontend-only progress simulation: one tick per logical image slot. It never touches files or the network and
 * stops reporting once stopped, so unmounting cannot produce stale updates.
 */
export function createSimulationRunner(options: {
  onProgress: (flowId: string, step: number, total: number) => void;
  onFinish: (flowId: string, outcome: SimulationOutcome, note: string) => void;
  intervalMs?: number;
  scheduler?: Scheduler;
  fails?: (flowId: string, attempt: number) => boolean;
}): SimulationRunner {
  const scheduler = options.scheduler ?? browserScheduler;
  const intervalMs = options.intervalMs ?? 450;
  const fails = options.fails ?? shouldFailDemo;
  const running = new Map<string, unknown>();

  const stop = (flowId: string) => {
    const handle = running.get(flowId);
    if (handle === undefined) return false;
    scheduler.clearInterval(handle);
    running.delete(flowId);
    return true;
  };

  return {
    start(flowId, attempt) {
      if (running.has(flowId)) return false;
      const willFail = fails(flowId, attempt);
      let step = 0;
      const handle = scheduler.setInterval(() => {
        if (!running.has(flowId)) return;
        step += 1;
        options.onProgress(flowId, step, SLOT_COUNT);
        if (willFail && step === FAIL_AT_STEP) {
          stop(flowId);
          options.onFinish(flowId, "failed", "Lỗi mô phỏng có chủ đích ở khung " + step + "/" + SLOT_COUNT + ". Bấm Thử lại để chạy tiếp.");
        } else if (step >= SLOT_COUNT) {
          stop(flowId);
          options.onFinish(flowId, "completed", "Mô phỏng hoàn tất. Không có ảnh nào được tạo.");
        }
      }, intervalMs);
      running.set(flowId, handle);
      return true;
    },
    cancel(flowId) {
      if (!stop(flowId)) return false;
      options.onFinish(flowId, "cancelled", "Người dùng hủy mô phỏng.");
      return true;
    },
    isRunning: flowId => running.has(flowId),
    stopAll() {
      const ids = [...running.keys()];
      ids.forEach(stop);
      return ids;
    }
  };
}
