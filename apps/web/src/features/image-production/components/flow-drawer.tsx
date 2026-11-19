"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Copy, Play, RotateCcw, Save, Square, Trash2, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@ecommerce-os/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@ecommerce-os/ui/components/sheet";
import { factoryHref } from "@/features/content-factory/navigation";
import { AssetImage, formatDate } from "@/features/products/components/product-ui";
import { useAssetUrls } from "@/features/products/hooks/use-products";
import { productEligibility, expectedImageCount, ratioFormats, validateConfig, type FlowRow } from "../services/flow-model";
import { MODE_INFO, BACKGROUND_INFO, STYLE_LABELS, type FlowConfig } from "../types/production";
import { ConfigFields } from "./config-fields";
import { rowCapabilities, type FlowActions } from "./flow-actions";
import { FlowStatusBadge, SimProgress } from "./flow-status";
import { SlotGallery } from "./slot-gallery";

const OUTCOME_LABEL = { completed: "Hoàn tất", failed: "Lỗi", cancelled: "Đã hủy", interrupted: "Bị gián đoạn" } as const;

function DrawerBody({ row, step, actions }: { row: FlowRow; step: number | undefined; actions: FlowActions }) {
  const { flow, product } = row;
  const [draft, setDraft] = useState<FlowConfig>(flow.config);
  const [saving, setSaving] = useState(false);
  const caps = rowCapabilities(row);
  const urls = useAssetUrls(product?.assets ?? []);
  const errors = validateConfig(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(flow.config);
  const eligibility = product ? productEligibility(product) : undefined;
  const formats = ratioFormats(flow.config.outputRatios);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <FlowStatusBadge status={row.status} />
        {row.status === "SIMULATING" && <SimProgress step={step ?? 0} />}
        <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">MÔ PHỎNG FRONTEND</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {caps.canCancel ? (
          <Button variant="outline" onClick={() => actions.cancel(flow.id)}><Square /> Hủy mô phỏng</Button>
        ) : (
          <Button onClick={() => actions.start(flow.id)} disabled={!caps.canStart} title={caps.canStart ? undefined : caps.startBlockedReason}><Play /> {caps.startLabel}</Button>
        )}
        {caps.canReset && <Button variant="outline" onClick={() => actions.reset(flow.id)}><RotateCcw /> Đặt lại trạng thái</Button>}
        <Button variant="outline" onClick={() => actions.duplicate(flow.id)}><Copy /> Nhân bản</Button>
        <Button variant="ghost" className="text-destructive" onClick={() => actions.remove(flow.id)}><Trash2 /> Xóa</Button>
      </div>
      {!caps.canStart && !caps.canCancel && caps.startBlockedReason && <p className="-mt-3 text-xs text-muted-foreground">Chưa thể chạy: {caps.startBlockedReason}</p>}

      <section aria-labelledby="d-product" className="grid gap-2">
        <h3 id="d-product" className="text-sm font-semibold">Sản phẩm</h3>
        {row.missing === "product" && (
          <p role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />Sản phẩm này đã bị xóa khỏi Product Studio. Flow giữ lại thông tin lúc tạo và không thể chạy mô phỏng.</p>
        )}
        {row.missing === "variant" && (
          <p role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />Phân loại {flow.snapshot.variantSku} đã bị xóa khỏi sản phẩm.</p>
        )}
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Tên</dt><dd className="break-words">{product?.name ?? flow.snapshot.productName}</dd>
          <dt className="text-muted-foreground">Mã sản phẩm</dt><dd className="font-mono text-xs">{product?.code ?? flow.snapshot.productCode}</dd>
          <dt className="text-muted-foreground">Phân loại</dt><dd>{flow.snapshot.variantSku ? <><span className="font-mono text-xs">{row.variant?.sku ?? flow.snapshot.variantSku}</span> {row.variant ? "· " + [row.variant.color, row.variant.size].filter(Boolean).join(" · ") : flow.snapshot.variantLabel ? "· " + flow.snapshot.variantLabel : ""}</> : "Cả sản phẩm"}</dd>
          <dt className="text-muted-foreground">Danh mục</dt><dd>{product?.category ?? flow.snapshot.category}</dd>
        </dl>
        {product && (
          <>
            <ul className="grid gap-1 text-sm" aria-label="Mức sẵn sàng của sản phẩm">
              {[
                ["Thông tin cơ bản", !eligibility?.reasons.includes("Thiếu thông tin cơ bản")],
                ["Có phân loại SKU", product.variants.length > 0],
                ["Có ảnh sản phẩm (" + product.assets.length + ")", product.assets.length > 0],
                ["Đặc tính đã xác minh (" + product.facts.filter(f => f.verified).length + "/" + product.facts.length + ")", product.facts.some(f => f.verified)]
              ].map(([label, done]) => (
                <li key={String(label)} className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <CircleDashed className="size-4 text-warning" aria-hidden />}
                  <span>{label}</span><span className="sr-only">{done ? "đã đủ" : "chưa đủ"}</span>
                </li>
              ))}
            </ul>
            {product.assets.length > 0 ? (
              <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Ảnh gốc của sản phẩm">
                {product.assets.map(a => <li key={a.id} className="shrink-0"><AssetImage asset={a} url={urls[a.id]} className="size-16 rounded-md border" /></li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Sản phẩm chưa có ảnh gốc.</p>}
            {!eligibility?.complete && <Link className={buttonVariants({ variant: "outline", size: "sm" }) + " justify-self-start"} href={factoryHref("products/" + product.id + "/edit")}>Bổ sung dữ liệu sản phẩm</Link>}
          </>
        )}
      </section>

      <section aria-labelledby="d-config" className="grid gap-3">
        <h3 id="d-config" className="text-sm font-semibold">Cấu hình sản xuất</h3>
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Đầu ra</dt><dd>{formats.join(" + ")}</dd>
          <dt className="text-muted-foreground">Số file dự kiến</dt><dd>{expectedImageCount(flow.config)} (9 khung × {formats.length} khổ). Chưa có file nào được tạo.</dd>
          <dt className="text-muted-foreground">Chế độ</dt><dd>{MODE_INFO[flow.config.productionMode].label}</dd>
          <dt className="text-muted-foreground">Phong cách · nền</dt><dd>{STYLE_LABELS[flow.config.imageStyle]} · {BACKGROUND_INFO[flow.config.backgroundMode].label}</dd>
        </dl>
        {caps.canEdit ? (
          <>
            <ConfigFields config={draft} onChange={setDraft} />
            {errors.length > 0 && <ul role="alert" className="text-xs text-destructive">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
            <div className="flex gap-2">
              <Button disabled={!dirty || errors.length > 0 || saving} onClick={async () => { setSaving(true); await actions.save(flow.id, draft); setSaving(false); }}><Save /> Lưu cấu hình</Button>
              <Button variant="outline" disabled={!dirty || saving} onClick={() => setDraft(flow.config)}>Hoàn tác</Button>
            </div>
          </>
        ) : <p className="text-xs text-muted-foreground">Không thể sửa khi đang mô phỏng. Hãy hủy mô phỏng trước.</p>}
      </section>

      <section aria-labelledby="d-slots" className="grid gap-2">
        <h3 id="d-slots" className="text-sm font-semibold">Bộ ảnh 9 khung</h3>
        <SlotGallery config={flow.config} product={product} status={row.status} />
      </section>

      <section aria-labelledby="d-runs" className="grid gap-2">
        <h3 id="d-runs" className="text-sm font-semibold">Lịch sử mô phỏng</h3>
        {flow.runs.length === 0 ? <p className="text-sm text-muted-foreground">Chưa chạy mô phỏng lần nào.</p> : (
          <ol className="grid gap-1.5 text-sm">
            {[...flow.runs].reverse().map(run => (
              <li key={run.id} className="rounded-md border p-2">
                <p className="font-medium">{OUTCOME_LABEL[run.outcome]} <span className="font-normal text-muted-foreground">· {formatDate(run.endedAt)}</span></p>
                <p className="text-xs text-muted-foreground">{run.note}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function FlowDrawer({ row, step, open, onOpenChange, actions }: { row: FlowRow | undefined; step: number | undefined; open: boolean; onOpenChange: (open: boolean) => void; actions: FlowActions }) {
  return (
    <Sheet open={open && !!row} onOpenChange={onOpenChange}>
      <SheetContent closeLabel="Đóng chi tiết flow" aria-describedby="drawer-desc">
        <div>
          <SheetTitle>{row ? row.product?.name ?? row.flow.snapshot.productName : "Chi tiết flow"}</SheetTitle>
          <SheetDescription id="drawer-desc">Chi tiết flow sản xuất ảnh. Dữ liệu và mô phỏng chỉ chạy trong trình duyệt.</SheetDescription>
        </div>
        {row && <DrawerBody key={row.flow.id + row.flow.updatedAt} row={row} step={step} actions={actions} />}
      </SheetContent>
    </Sheet>
  );
}
