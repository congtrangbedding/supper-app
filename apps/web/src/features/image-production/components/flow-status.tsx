import { cn } from "@ecommerce-os/ui/lib/utils";
import { FLOW_STATUS_LABELS, SLOT_COUNT, type FlowStatus } from "../types/production";

const styles: Record<FlowStatus, string> = {
  DRAFT: "border-warning/40 bg-warning/10 text-warning",
  READY: "border-success/30 bg-success/10 text-success",
  SIMULATING: "border-primary/40 bg-primary/10 text-primary",
  DEMO_COMPLETED: "border-border bg-secondary text-secondary-foreground",
  DEMO_FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-background text-muted-foreground"
};

export function FlowStatusBadge({ status }: { status: FlowStatus }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles[status])}>{FLOW_STATUS_LABELS[status]}</span>;
}

export function SimProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label="Tiến độ mô phỏng" aria-valuemin={0} aria-valuemax={SLOT_COUNT} aria-valuenow={step}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-[width]" style={{ width: (step / SLOT_COUNT) * 100 + "%" }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{step}/{SLOT_COUNT}</span>
    </div>
  );
}
