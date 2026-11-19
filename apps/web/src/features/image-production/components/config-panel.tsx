"use client";
import { useId, useState } from "react";
import { ChevronDown, Loader2, Plus, RotateCcw } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";
import type { Product } from "@/features/products/types/product";
import { expectedImageCount, expandTargets, validateConfig, duplicateSkuTargets, type Selection } from "../services/flow-model";
import { defaultConfig } from "../services/flow-model";
import { SLOT_COUNT, type FlowConfig } from "../types/production";
import { ConfigFields } from "./config-fields";
import { ProductPicker } from "./product-picker";

export function ConfigPanel({
  products,
  selection,
  onSelectionChange,
  config,
  onConfigChange,
  onCreate,
  creating
}: {
  products: readonly Product[];
  selection: Selection;
  onSelectionChange: (next: Selection) => void;
  config: FlowConfig;
  onConfigChange: (next: FlowConfig) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const uid = useId();
  const [advanced, setAdvanced] = useState(true);
  const targets = expandTargets(selection, products);
  const errors = validateConfig(config);
  const dupSkus = duplicateSkuTargets(targets, products);
  const perFlow = expectedImageCount(config);
  const blocked = targets.length === 0 || errors.length > 0 || creating;

  return (
    <div className="grid gap-5">
      <section aria-labelledby={uid + "p"} className="grid gap-2">
        <h2 id={uid + "p"} className="text-sm font-semibold">1. Chọn sản phẩm</h2>
        <ProductPicker products={products} selection={selection} onChange={onSelectionChange} />
      </section>

      <section aria-labelledby={uid + "c"} className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id={uid + "c"} className="text-sm font-semibold">2. Cấu hình sản xuất</h2>
          <button type="button" className="inline-flex items-center gap-1 rounded text-xs text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" aria-expanded={advanced} onClick={() => setAdvanced(v => !v)}>
            Nâng cao <ChevronDown className={"size-3.5 transition-transform " + (advanced ? "rotate-180" : "")} aria-hidden />
          </button>
        </div>
        <ConfigFields config={config} onChange={onConfigChange} showAdvanced={advanced} />
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => onConfigChange(defaultConfig())}><RotateCcw /> Đặt lại cấu hình mặc định</Button>
      </section>

      <section aria-labelledby={uid + "s"} className="grid gap-2 rounded-lg border bg-secondary/40 p-3 text-sm">
        <h2 id={uid + "s"} className="text-sm font-semibold">3. Xem lại và tạo</h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Sản phẩm đã chọn</dt><dd className="text-right tabular-nums">{Object.keys(selection).length}</dd>
          <dt className="text-muted-foreground">Flow sẽ tạo (sản phẩm × phân loại)</dt><dd className="text-right tabular-nums">{targets.length}</dd>
          <dt className="text-muted-foreground">Khung ảnh mỗi flow</dt><dd className="text-right tabular-nums">{SLOT_COUNT}</dd>
          <dt className="font-medium">Ảnh dự kiến</dt><dd className="text-right font-medium tabular-nums">{targets.length * perFlow}</dd>
        </dl>
        <p className="text-xs text-muted-foreground">“Ảnh dự kiến” là số khung kế hoạch. Giai đoạn này chưa tạo ảnh thật.</p>
        {dupSkus.length > 0 && <p role="status" className="text-xs text-warning">SKU trùng giữa các lựa chọn: {dupSkus.join(", ")}.</p>}
        {errors.length > 0 && <ul role="alert" className="text-xs text-destructive">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
        <Button onClick={onCreate} disabled={blocked} aria-busy={creating}>
          {creating ? <Loader2 className="animate-spin" /> : <Plus />} {creating ? "Đang tạo…" : "Tạo " + targets.length + " flow"}
        </Button>
        {targets.length === 0 && <p className="text-xs text-muted-foreground">Chọn ít nhất một sản phẩm để tạo flow.</p>}
      </section>
    </div>
  );
}
