"use client";
import { useId, useMemo, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Input } from "@ecommerce-os/ui/components/input";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { ProductThumb } from "@/features/products/components/product-ui";
import { matchesSearch } from "@/features/products/services/product-query";
import type { Product } from "@/features/products/types/product";
import { productEligibility, toggleProduct, toggleVariant, variantLabel, type Selection } from "../services/flow-model";

export function ProductPicker({ products, selection, onChange }: { products: readonly Product[]; selection: Selection; onChange: (next: Selection) => void }) {
  const uid = useId();
  const [search, setSearch] = useState("");
  const visible = useMemo(() => products.filter(p => matchesSearch(p, search)), [products, search]);
  const visibleIds = visible.map(p => p.id);
  const allVisible = visible.length > 0 && visibleIds.every(id => id in selection);

  function toggleAllVisible() {
    let next = selection;
    for (const p of visible) {
      const selected = p.id in next;
      if (allVisible ? selected : !selected) next = toggleProduct(next, p);
    }
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Input type="search" aria-label="Tìm sản phẩm theo tên, mã hoặc SKU" placeholder="Tìm tên, mã, SKU…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Object.keys(selection).length} sản phẩm đã chọn</span>
        <div className="flex gap-3">
          <button type="button" className="rounded text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50" onClick={toggleAllVisible} disabled={visible.length === 0}>{allVisible ? "Bỏ chọn hiển thị" : "Chọn tất cả hiển thị"}</button>
          {Object.keys(selection).length > 0 && <button type="button" className="rounded text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" onClick={() => onChange({})}>Bỏ chọn hết</button>}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Chưa có sản phẩm nào. Hãy thêm sản phẩm trong Product Studio trước.</p>
      ) : visible.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground" role="status">Không có sản phẩm khớp “{search}”.</p>
      ) : (
        <ul className="max-h-80 divide-y overflow-y-auto rounded-md border" aria-label="Danh sách sản phẩm">
          {visible.map(p => {
            const eligibility = productEligibility(p);
            const selected = p.id in selection;
            const inputId = uid + p.id;
            return (
              <li key={p.id} className={cn("p-2", selected && "bg-primary/5")}>
                <div className="flex items-start gap-2">
                  <input id={inputId} type="checkbox" className="mt-3 size-4 shrink-0 accent-[var(--color-primary)]" checked={selected} onChange={() => onChange(toggleProduct(selection, p))} />
                  <label htmlFor={inputId} className="flex min-w-0 flex-1 cursor-pointer gap-2">
                    <ProductThumb product={p} className="size-10 object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground"><span className="font-mono">{p.code}</span> · {p.variants.length} phân loại · {p.assets.length} ảnh</span>
                    </span>
                  </label>
                </div>
                <p className={cn("mt-1 ml-6 flex items-start gap-1 text-xs", eligibility.complete ? "text-success" : "text-warning")}>
                  {eligibility.complete ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                  <span>{eligibility.complete ? "Đủ dữ liệu để sản xuất" : "Chưa đủ: " + eligibility.reasons.join(", ") + ". Flow sẽ ở trạng thái Nháp."}</span>
                </p>
                {selected && p.variants.length > 0 && (
                  <fieldset className="mt-2 ml-6 grid gap-1">
                    <legend className="sr-only">Phân loại của {p.name}</legend>
                    {p.variants.map(v => (
                      <label key={v.id} className="flex cursor-pointer items-center gap-2 text-xs">
                        <input type="checkbox" className="size-3.5 accent-[var(--color-primary)]" checked={(selection[p.id] ?? []).includes(v.id)} onChange={() => onChange(toggleVariant(selection, p, v.id))} />
                        <span className="font-mono">{v.sku}</span>
                        <span className="truncate text-muted-foreground">{variantLabel(v)}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
