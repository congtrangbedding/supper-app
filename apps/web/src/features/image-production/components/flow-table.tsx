"use client";
import { useId } from "react";
import { Copy, Eye, MoreHorizontal, Pencil, Play, RotateCcw, Square, Trash2, TriangleAlert, Layers, Ratio, SearchX } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@ecommerce-os/ui/components/dropdown-menu";
import { Input, NativeSelect } from "@ecommerce-os/ui/components/input";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { ProductThumb, formatDate } from "@/features/products/components/product-ui";
import { PRODUCT_CATEGORIES } from "@/features/products/types/product";
import { DEFAULT_FLOW_QUERY, expectedImageCount, FLOW_SORT_LABELS, isFlowFiltered, paginate, ratioFormats, type FlowQuery, type FlowRow, type FlowSort } from "../services/flow-model";
import { FLOW_STATUSES, FLOW_STATUS_LABELS, MODE_INFO, RATIO_INFO, SLOT_COUNT } from "../types/production";
import { rowCapabilities, type FlowActions } from "./flow-actions";
import { FlowStatusBadge, SimProgress } from "./flow-status";

export interface BulkHandlers {
  start: () => void;
  duplicate: () => void;
  remove: () => void;
  template: () => void;
  ratio: () => void;
}

function RowMenu({ row, actions }: { row: FlowRow; actions: FlowActions }) {
  const caps = rowCapabilities(row);
  const name = row.product?.name ?? row.flow.snapshot.productName;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={"Thao tác với " + name}><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => actions.view(row.flow.id)}><Eye /> Xem flow</DropdownMenuItem>
        <DropdownMenuItem disabled={!caps.canEdit} onSelect={() => actions.edit(row.flow.id)}><Pencil /> Sửa cấu hình</DropdownMenuItem>
        {caps.canCancel ? (
          <DropdownMenuItem onSelect={() => actions.cancel(row.flow.id)}><Square /> Hủy mô phỏng</DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={!caps.canStart} onSelect={() => actions.start(row.flow.id)}><Play /> {caps.startLabel}</DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={!caps.canReset} onSelect={() => actions.reset(row.flow.id)}><RotateCcw /> Đặt lại trạng thái</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.duplicate(row.flow.id)}><Copy /> Nhân bản</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => actions.remove(row.flow.id)}><Trash2 /> Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusCell({ row, step }: { row: FlowRow; step: number | undefined }) {
  return (
    <div className="grid gap-1">
      <FlowStatusBadge status={row.status} />
      {row.status === "SIMULATING" && <SimProgress step={step ?? 0} />}
      {row.blockers.length > 0 && row.status === "DRAFT" && <span className="flex items-start gap-1 text-[11px] text-warning"><TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />{row.blockers.join("; ")}</span>}
      {row.missing && row.status !== "DRAFT" && <span className="text-[11px] text-destructive">{row.missing === "product" ? "Sản phẩm đã bị xóa" : "Phân loại đã bị xóa"}</span>}
    </div>
  );
}

function NameCell({ row, onView }: { row: FlowRow; onView: () => void }) {
  const name = row.product?.name ?? row.flow.snapshot.productName;
  const code = row.product?.code ?? row.flow.snapshot.productCode;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {row.product ? <ProductThumb product={row.product} className="size-10 object-cover" /> : <div className="grid size-10 shrink-0 place-items-center rounded-md border border-dashed text-[10px] text-muted-foreground" aria-hidden>Đã xóa</div>}
      <div className="min-w-0">
        <button type="button" onClick={onView} className="block max-w-full truncate rounded text-left text-sm font-medium hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">{name}</button>
        <p className="truncate font-mono text-xs text-muted-foreground">{row.flow.snapshot.variantSku ?? code}</p>
      </div>
    </div>
  );
}

export function FlowTable({
  rows,
  filtered,
  progress,
  query,
  onQueryChange,
  page,
  onPageChange,
  selected,
  onSelectedChange,
  actions,
  bulk,
  compact
}: {
  /** true while the settings panel is docked beside the table (xl and up): secondary columns move to the drawer */
  compact: boolean;
  rows: readonly FlowRow[];
  filtered: readonly FlowRow[];
  progress: Record<string, number>;
  query: FlowQuery;
  onQueryChange: (q: FlowQuery) => void;
  page: number;
  onPageChange: (p: number) => void;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
  actions: FlowActions;
  bulk: BulkHandlers;
}) {
  const uid = useId();
  const extra = compact ? "xl:hidden" : "";
  const view = paginate(filtered, page);
  const pageIds = view.items.map(r => r.flow.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someOnPage = pageIds.some(id => selected.has(id));
  const selectedCount = rows.filter(r => selected.has(r.flow.id)).length;
  const set = (patch: Partial<FlowQuery>) => { onQueryChange({ ...query, ...patch }); onPageChange(1); };
  const toggle = (id: string) => { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); onSelectedChange(next); };
  const togglePage = () => { const next = new Set(selected); pageIds.forEach(id => (allOnPage ? next.delete(id) : next.add(id))); onSelectedChange(next); };
  const startIndex = (view.page - 1) * 10;

  return (
    <section aria-labelledby={uid + "t"} className="min-w-0 rounded-lg border bg-card">
      <div className="grid gap-3 border-b p-3">
        <h2 id={uid + "t"} className="text-base font-semibold">Danh sách flow sản xuất <span className="text-sm font-normal text-muted-foreground">({filtered.length}{filtered.length !== rows.length ? "/" + rows.length : ""})</span></h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <Input type="search" aria-label="Tìm flow theo tên sản phẩm, mã hoặc SKU" placeholder="Tìm tên, mã, SKU…" value={query.search} onChange={e => set({ search: e.target.value })} className="sm:col-span-2 xl:col-span-1" />
          <NativeSelect aria-label="Lọc theo trạng thái" value={query.status} onChange={e => set({ status: e.target.value as FlowQuery["status"] })}>
            <option value="all">Mọi trạng thái</option>
            {FLOW_STATUSES.map(s => <option key={s} value={s}>{FLOW_STATUS_LABELS[s]}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="Lọc theo danh mục" value={query.category} onChange={e => set({ category: e.target.value })}>
            <option value="all">Mọi danh mục</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="Sắp xếp" value={query.sort} onChange={e => set({ sort: e.target.value as FlowSort })}>
            {(Object.keys(FLOW_SORT_LABELS) as FlowSort[]).map(k => <option key={k} value={k}>{FLOW_SORT_LABELS[k]}</option>)}
          </NativeSelect>
        </div>
        {isFlowFiltered(query) && <button type="button" className="justify-self-start rounded text-xs text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" onClick={() => { onQueryChange({ ...DEFAULT_FLOW_QUERY, sort: query.sort }); onPageChange(1); }}>Xóa bộ lọc</button>}
      </div>

      {selectedCount > 0 && (
        <div role="region" aria-label="Thao tác hàng loạt" className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium" role="status">{selectedCount} đã chọn</span>
          <Button size="sm" onClick={bulk.start}><Play /> Chạy mô phỏng</Button>
          <Button size="sm" variant="outline" onClick={bulk.duplicate}><Copy /> Nhân bản</Button>
          <Button size="sm" variant="outline" onClick={bulk.template}><Layers /> Đổi bộ template</Button>
          <Button size="sm" variant="outline" onClick={bulk.ratio}><Ratio /> Đổi tỷ lệ</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={bulk.remove}><Trash2 /> Xóa</Button>
          <Button size="sm" variant="ghost" onClick={() => onSelectedChange(new Set())}>Bỏ chọn</Button>
          {filtered.length > pageIds.length && !filtered.every(r => selected.has(r.flow.id)) && (
            <button type="button" className="rounded text-xs text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" onClick={() => onSelectedChange(new Set([...selected, ...filtered.map(r => r.flow.id)]))}>Chọn cả {filtered.length} flow khớp bộ lọc</button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="grid place-items-center gap-2 p-10 text-center" role="status">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">{rows.length === 0 ? "Chưa có flow sản xuất nào" : "Không có flow khớp bộ lọc"}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{rows.length === 0 ? "Chọn sản phẩm ở bảng cấu hình bên trái rồi bấm “Tạo flow”." : "Thử đổi từ khóa hoặc xóa bộ lọc."}</p>
        </div>
      ) : (
        <>
          {/* table from md up */}
          <div className="relative hidden overflow-x-auto md:block">
            <table className={cn("w-full min-w-[1080px] text-left text-sm", compact && "xl:min-w-0")}>
              <caption className="sr-only">Danh sách flow sản xuất ảnh</caption>
              <thead className="border-b bg-secondary/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2"><input type="checkbox" aria-label="Chọn tất cả flow trong trang" className="size-4 accent-[var(--color-primary)]" checked={allOnPage} ref={el => { if (el) el.indeterminate = !allOnPage && someOnPage; }} onChange={togglePage} /></th>
                  <th scope="col" className="w-10 px-2 py-2 font-medium">#</th>
                  <th scope="col" className="px-2 py-2 font-medium">Sản phẩm</th>
                  <th scope="col" className="px-2 py-2 font-medium">Trạng thái</th>
                  <th scope="col" className="px-2 py-2 font-medium">Phân loại</th>
                  <th scope="col" className={cn("px-2 py-2 font-medium", extra)}>Bộ template</th>
                  <th scope="col" className={cn("px-2 py-2 font-medium", extra)}>Khung</th>
                  <th scope="col" className="px-2 py-2 font-medium">Tỷ lệ</th>
                  <th scope="col" className="px-2 py-2 font-medium">Ảnh dự kiến</th>
                  <th scope="col" className={cn("px-2 py-2 font-medium", extra)}>Chế độ</th>
                  <th scope="col" className={cn("px-2 py-2 font-medium", extra)}>Cập nhật</th>
                  <th scope="col" className="w-12 px-2 py-2"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {view.items.map((row, i) => (
                  <tr key={row.flow.id} className={cn("align-top", selected.has(row.flow.id) && "bg-primary/5")}>
                    <td className="px-3 py-2"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" aria-label={"Chọn " + (row.product?.name ?? row.flow.snapshot.productName)} checked={selected.has(row.flow.id)} onChange={() => toggle(row.flow.id)} /></td>
                    <td className="px-2 py-2 text-muted-foreground tabular-nums">{startIndex + i + 1}</td>
                    <td className="max-w-64 px-2 py-2"><NameCell row={row} onView={() => actions.view(row.flow.id)} /></td>
                    <td className="px-2 py-2"><StatusCell row={row} step={progress[row.flow.id]} /></td>
                    <td className="px-2 py-2 text-xs">{row.flow.snapshot.variantLabel ?? <span className="text-muted-foreground">Cả sản phẩm</span>}</td>
                    <td className={cn("px-2 py-2 text-xs", extra)}>{row.flow.config.templateSetName}</td>
                    <td className={cn("px-2 py-2 tabular-nums", extra)}>{SLOT_COUNT}</td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap">{RATIO_INFO[row.flow.config.outputRatios].label}</td>
                    <td className="px-2 py-2 tabular-nums">{expectedImageCount(row.flow.config)}</td>
                    <td className={cn("px-2 py-2 text-xs whitespace-nowrap", extra)}>{MODE_INFO[row.flow.config.productionMode].label}</td>
                    <td className={cn("px-2 py-2 text-xs whitespace-nowrap text-muted-foreground", extra)}>{formatDate(row.flow.updatedAt)}</td>
                    <td className="px-2 py-2"><RowMenu row={row} actions={actions} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* cards below md */}
          <ul className="divide-y md:hidden" aria-label="Danh sách flow sản xuất ảnh">
            {view.items.map(row => (
              <li key={row.flow.id} className={cn("grid gap-2 p-3", selected.has(row.flow.id) && "bg-primary/5")}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-3 size-4 shrink-0 accent-[var(--color-primary)]" aria-label={"Chọn " + (row.product?.name ?? row.flow.snapshot.productName)} checked={selected.has(row.flow.id)} onChange={() => toggle(row.flow.id)} />
                  <div className="min-w-0 flex-1"><NameCell row={row} onView={() => actions.view(row.flow.id)} /></div>
                  <RowMenu row={row} actions={actions} />
                </div>
                <dl className="ml-6 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Phân loại</dt><dd>{row.flow.snapshot.variantLabel ?? "Cả sản phẩm"}</dd>
                  <dt className="text-muted-foreground">Bộ template</dt><dd>{row.flow.config.templateSetName}</dd>
                  <dt className="text-muted-foreground">Đầu ra</dt><dd>{SLOT_COUNT} khung · {ratioFormats(row.flow.config.outputRatios).length === 2 ? "2 khổ" : RATIO_INFO[row.flow.config.outputRatios].label} · {expectedImageCount(row.flow.config)} ảnh dự kiến</dd>
                  <dt className="text-muted-foreground">Chế độ</dt><dd>{MODE_INFO[row.flow.config.productionMode].label}</dd>
                  <dt className="text-muted-foreground">Cập nhật</dt><dd>{formatDate(row.flow.updatedAt)}</dd>
                </dl>
                <div className="ml-6"><StatusCell row={row} step={progress[row.flow.id]} /></div>
              </li>
            ))}
          </ul>

          {/* div+role instead of <nav>: the legacy global `nav` rule in globals.css would stretch a <nav> */}
          <div role="navigation" aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-sm">
            <span className="text-muted-foreground" role="status">Trang {view.page}/{view.pages} · {view.total} flow</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={view.page <= 1} onClick={() => onPageChange(view.page - 1)}>Trang trước</Button>
              <Button size="sm" variant="outline" disabled={view.page >= view.pages} onClick={() => onPageChange(view.page + 1)}>Trang sau</Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
