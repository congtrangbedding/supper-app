import type { Summary } from "../services/flow-model";

export function ProductionSummary({ summary }: { summary: Summary }) {
  const items = [
    { label: "Tổng flow", value: summary.total },
    { label: "Sẵn sàng", value: summary.ready },
    { label: "Đang mô phỏng", value: summary.simulating },
    { label: "Mô phỏng xong", value: summary.completed },
    { label: "Mô phỏng lỗi", value: summary.failed }
  ];
  return (
    <section aria-label="Tổng hợp flow sản xuất" className="mb-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(item => (
          <div key={item.label} className="rounded-lg border bg-card p-3">
            <dd className="text-2xl font-semibold tabular-nums">{item.value}</dd>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
