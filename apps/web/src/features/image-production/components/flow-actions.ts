import type { FlowRow } from "../services/flow-model";
import type { FlowConfig } from "../types/production";

export function rowCapabilities(row: FlowRow) {
  const s = row.status;
  const runnable = s === "READY" || s === "DEMO_FAILED" || s === "CANCELLED";
  return {
    canStart: runnable && row.blockers.length === 0,
    startLabel: s === "DEMO_FAILED" ? "Thử lại" : "Bắt đầu mô phỏng",
    canCancel: s === "SIMULATING",
    canReset: s === "DEMO_COMPLETED" || s === "DEMO_FAILED" || s === "CANCELLED",
    canEdit: s !== "SIMULATING",
    /** shown as the reason when Start is disabled */
    startBlockedReason: s === "SIMULATING" ? "Đang mô phỏng." : s === "DEMO_COMPLETED" ? "Hãy đặt lại trạng thái trước khi chạy lại." : row.blockers.join("; ")
  };
}

/** Row-level operations implemented once by the workspace and passed to the table and drawer. */
export interface FlowActions {
  view: (id: string) => void;
  edit: (id: string) => void;
  start: (id: string) => void;
  cancel: (id: string) => void;
  reset: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  save: (id: string, config: FlowConfig) => Promise<boolean>;
}
