"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, PanelLeftClose, Plus, RotateCcw } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@ecommerce-os/ui/components/sheet";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { DemoBadge, PageHeader } from "@/features/content-factory/components/page-header";
import { useToast } from "@/features/content-factory/components/toast";
import { factoryCrumbs } from "@/features/content-factory/navigation";
import { ConfirmDialog } from "@/features/products/components/product-ui";
import { ErrorView, LoadingView, NoticeBanner } from "@/features/products/components/state-views";
import { useProducts } from "@/features/products/hooks/use-products";
import { useProductionFlows } from "../hooks/use-production";
import {
  applyPreset,
  DEFAULT_FLOW_QUERY,
  defaultConfig,
  expandTargets,
  pruneSelection,
  queryRows,
  snapshotFor,
  summarize,
  toRows,
  type FlowQuery,
  type Selection
} from "../services/flow-model";
import { getPreset } from "../services/presets";
import type { BulkResult, NewFlowInput } from "../services/production-repository";
import { productionStore } from "../services/production-store";
import type { FlowConfig, RatioChoice } from "../types/production";
import { BulkDialog, type BulkKind } from "./bulk-dialogs";
import { ConfigPanel } from "./config-panel";
import type { FlowActions } from "./flow-actions";
import { FlowDrawer } from "./flow-drawer";
import { FlowTable } from "./flow-table";
import { ProductionSummary } from "./production-summary";

export function ProductionWorkspace() {
  const { status: productStatus, products, notice: productNotice, error: productError, actions: productActions } = useProducts();
  const { status, flows, progress, notice, error, actions: store } = useProductionFlows();
  const { toast } = useToast();

  const [selection, setSelection] = useState<Selection>({});
  const [config, setConfig] = useState<FlowConfig>(() => defaultConfig());
  const [query, setQuery] = useState<FlowQuery>(DEFAULT_FLOW_QUERY);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [duplicateInputs, setDuplicateInputs] = useState<NewFlowInput[] | null>(null);
  const [bulkKind, setBulkKind] = useState<BulkKind | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const inFlight = useRef(false);

  // Simulation timers live in the shared store. Leaving the page stops them; reload cannot resume them either.
  useEffect(() => () => void productionStore.interruptSimulations(), []);

  const rows = useMemo(() => toRows(flows, products), [flows, products]);
  const filtered = useMemo(() => queryRows(rows, query), [rows, query]);
  const summary = useMemo(() => summarize(rows), [rows]);
  const cleanSelection = useMemo(() => pruneSelection(selection, products), [selection, products]);
  const selectedIds = useMemo(() => rows.filter(r => selected.has(r.flow.id)).map(r => r.flow.id), [rows, selected]);
  const drawerRow = rows.find(r => r.flow.id === drawerId);

  if (productStatus === "loading" || status === "loading") return <><Header onNew={() => undefined} onToggle={() => undefined} onReset={() => undefined} panelVisible /><LoadingView label="Đang tải sản phẩm và flow…" /></>;
  if (productStatus === "error") return <><Header onNew={() => undefined} onToggle={() => undefined} onReset={() => undefined} panelVisible /><ErrorView message={productError ?? "Lỗi không xác định."} onRetry={() => void productActions.refresh()} /></>;
  if (status === "error") return <><Header onNew={() => undefined} onToggle={() => undefined} onReset={() => undefined} panelVisible /><ErrorView message={error ?? "Lỗi không xác định."} onRetry={() => void store.refresh()} /></>;

  const fail = (title: string, e: unknown) => toast({ tone: "error", title, description: e instanceof Error ? e.message : undefined });
  const nameOf = (id: string) => {
    const r = rows.find(x => x.flow.id === id);
    return r?.product?.name ?? r?.flow.snapshot.productName ?? "flow";
  };
  const reportBulk = (title: string, result: BulkResult) => {
    const detail = result.skipped.length ? "Bỏ qua " + result.skipped.length + ": " + [...new Set(result.skipped.map(s => s.reason))].slice(0, 2).join(" · ") : undefined;
    toast({ tone: result.updated.length ? "success" : "info", title: result.updated.length ? title + " " + result.updated.length + " flow" : "Không có flow nào được cập nhật", description: detail });
  };

  async function create(inputs: NewFlowInput[], allowDuplicates: boolean) {
    if (inFlight.current) return; // double submit
    inFlight.current = true;
    setCreating(true);
    try {
      const result = await store.createFlows(inputs, config, { allowDuplicates });
      if (result.created.length > 0) toast({ title: "Đã tạo " + result.created.length + " flow", description: "Mỗi flow có 9 khung ảnh kế hoạch. Chưa có ảnh nào được tạo." });
      if (result.overLimit.length > 0) toast({ tone: "error", title: result.overLimit.length + " flow không được tạo", description: "Đã đạt giới hạn số flow demo. Hãy xóa bớt." });
      if (result.duplicates.length > 0) setDuplicateInputs(result.duplicates);
      else {
        setSelection({});
        setSheetOpen(false);
      }
    } catch (e) {
      fail("Không tạo được flow", e);
    } finally {
      inFlight.current = false;
      setCreating(false);
    }
  }

  function onCreate() {
    const inputs: NewFlowInput[] = expandTargets(cleanSelection, products).flatMap(t => {
      const product = products.find(p => p.id === t.productId);
      if (!product) return [];
      const variant = product.variants.find(v => v.id === t.variantId);
      return [{ productId: product.id, variantId: variant?.id, snapshot: snapshotFor(product, variant) }];
    });
    void create(inputs, false);
  }

  async function runStart(ids: string[]) {
    try {
      const r = await store.start(ids, products);
      if (r.started.length) toast({ title: "Bắt đầu mô phỏng " + r.started.length + " flow", description: "Chỉ mô phỏng trên trình duyệt. Không tạo ảnh." });
      if (r.skipped.length) toast({ tone: "info", title: "Bỏ qua " + r.skipped.length + " flow", description: [...new Set(r.skipped.map(s => s.reason))].slice(0, 2).join(" · ") });
    } catch (e) {
      fail("Không bắt đầu được mô phỏng", e);
    }
  }

  const actions: FlowActions = {
    view: id => setDrawerId(id),
    edit: id => setDrawerId(id),
    start: id => void runStart([id]),
    cancel: id => { store.cancel(id); toast({ tone: "info", title: "Đã hủy mô phỏng", description: nameOf(id) }); },
    reset: id => void store.reset([id]).then(r => reportBulk("Đã đặt lại", r), e => fail("Không đặt lại được", e)),
    duplicate: id => void store.duplicate([id]).then(c => toast({ title: "Đã nhân bản flow", description: nameOf(id) + " · " + c.length + " bản sao" }), e => fail("Không nhân bản được", e)),
    remove: id => setDeleteIds([id]),
    save: async (id, next) => {
      try {
        await store.updateFlow(id, { config: next });
        toast({ title: "Đã lưu cấu hình flow" });
        return true;
      } catch (e) {
        fail("Không lưu được cấu hình", e);
        return false;
      }
    }
  };

  async function applyBulk(kind: BulkKind, value: string) {
    setBulkKind(null);
    try {
      if (kind === "template") {
        const preset = getPreset(value);
        if (!preset) return;
        const next = applyPreset(defaultConfig(), preset);
        reportBulk("Đã đổi bộ template cho", await store.bulkUpdate(selectedIds, { config: { templateSetId: next.templateSetId, templateSetName: next.templateSetName, imageStyle: next.imageStyle, slots: next.slots } }));
      } else {
        reportBulk("Đã đổi tỷ lệ cho", await store.bulkUpdate(selectedIds, { config: { outputRatios: value as RatioChoice } }));
      }
    } catch (e) {
      fail("Không cập nhật được", e);
    }
  }

  async function confirmDelete() {
    if (!deleteIds) return;
    const ids = deleteIds;
    try {
      await store.remove(ids);
      setSelected(prev => new Set([...prev].filter(id => !ids.includes(id))));
      toast({ title: "Đã xóa " + ids.length + " flow" });
    } catch (e) {
      fail("Không xóa được flow", e);
    }
    setDeleteIds(null);
  }

  function openSettings() {
    if (window.matchMedia("(min-width: 1280px)").matches) setPanelVisible(true);
    else setSheetOpen(true);
  }

  const panel = (
    <ConfigPanel products={products} selection={cleanSelection} onSelectionChange={setSelection} config={config} onConfigChange={setConfig} onCreate={onCreate} creating={creating} />
  );

  return (
    <>
      <Header onNew={openSettings} onToggle={() => setPanelVisible(v => !v)} onSheet={() => setSheetOpen(true)} onReset={() => setConfirmResetAll(true)} panelVisible={panelVisible} />
      {productNotice && <NoticeBanner>{productNotice}</NoticeBanner>}
      {notice && <NoticeBanner>{notice}</NoticeBanner>}
      <ProductionSummary summary={summary} />

      <div className={cn("grid gap-6", panelVisible && "xl:grid-cols-[22rem_minmax(0,1fr)]")}>
        <aside aria-label="Cấu hình sản xuất" className={cn("hidden rounded-lg border bg-card p-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto", panelVisible && "xl:block")}>{panel}</aside>
        <FlowTable
          rows={rows}
          filtered={filtered}
          progress={progress}
          query={query}
          onQueryChange={setQuery}
          page={page}
          onPageChange={setPage}
          selected={selected}
          onSelectedChange={setSelected}
          actions={actions}
          compact={panelVisible}
          bulk={{
            start: () => void runStart(selectedIds),
            duplicate: () => void store.duplicate(selectedIds).then(c => toast({ title: "Đã nhân bản " + c.length + " flow" }), e => fail("Không nhân bản được", e)),
            remove: () => setDeleteIds(selectedIds),
            template: () => setBulkKind("template"),
            ratio: () => setBulkKind("ratio")
          }}
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" closeLabel="Đóng cấu hình sản xuất">
          <div><SheetTitle>Cấu hình sản xuất</SheetTitle><SheetDescription>Chọn sản phẩm, cấu hình và tạo flow.</SheetDescription></div>
          {sheetOpen && panel}
        </SheetContent>
      </Sheet>

      <FlowDrawer row={drawerRow} step={drawerId ? progress[drawerId] : undefined} open={drawerId !== null} onOpenChange={open => { if (!open) setDrawerId(null); }} actions={actions} />

      <BulkDialog kind={bulkKind} count={selectedIds.length} onConfirm={(k, v) => void applyBulk(k, v)} onClose={() => setBulkKind(null)} />

      <ConfirmDialog
        open={deleteIds !== null}
        onOpenChange={open => { if (!open) setDeleteIds(null); }}
        title={"Xóa " + (deleteIds?.length ?? 0) + " flow?"}
        description="Flow đang mô phỏng sẽ bị hủy. Sản phẩm và ảnh gốc không bị ảnh hưởng. Thao tác này không hoàn tác được."
        confirmLabel="Xóa"
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmDialog
        open={duplicateInputs !== null}
        onOpenChange={open => { if (!open) setDuplicateInputs(null); }}
        title="Đã có flow cho sản phẩm này"
        description={(duplicateInputs?.length ?? 0) + " lựa chọn đã có flow sản xuất. Bạn có muốn tạo thêm một dự án riêng cho mỗi lựa chọn đó không?"}
        confirmLabel="Tạo thêm"
        onConfirm={() => {
          const inputs = duplicateInputs ?? [];
          setDuplicateInputs(null);
          setSelection({});
          void create(inputs, true);
        }}
      />
      <ConfirmDialog
        open={confirmResetAll}
        onOpenChange={setConfirmResetAll}
        title="Đặt lại mọi mô phỏng?"
        description="Mọi flow quay về Sẵn sàng và lịch sử mô phỏng bị xóa. Flow và cấu hình được giữ nguyên."
        confirmLabel="Đặt lại"
        onConfirm={() => { setConfirmResetAll(false); void store.resetAll().then(() => toast({ title: "Đã đặt lại mô phỏng" }), e => fail("Không đặt lại được", e)); }}
      />
    </>
  );
}

function Header({ onNew, onToggle, onSheet, onReset, panelVisible }: { onNew: () => void; onToggle: () => void; onSheet?: () => void; onReset: () => void; panelVisible: boolean }) {
  return (
    <PageHeader
      title="Xưởng sản xuất ảnh"
      description="Cấu hình và tạo hàng loạt flow sản xuất bộ ảnh 9 khung cho từng sản phẩm. Giai đoạn này chỉ lập kế hoạch và mô phỏng trên trình duyệt, chưa tạo ảnh thật."
      crumbs={factoryCrumbs("images/production")}
      meta={<><DemoBadge>CHẾ ĐỘ DEMO</DemoBadge><span className="text-xs text-muted-foreground">Không gọi AI, không có tệp ảnh được tạo ra.</span></>}
      actions={
        <>
          <Button onClick={onNew}><Plus /> Tạo flow mới</Button>
          <Button variant="outline" className="xl:hidden" onClick={onSheet}><PanelLeft /> Cấu hình</Button>
          <Button variant="outline" className="hidden xl:inline-flex" aria-pressed={panelVisible} onClick={onToggle}>{panelVisible ? <PanelLeftClose /> : <PanelLeft />} {panelVisible ? "Ẩn cấu hình" : "Hiện cấu hình"}</Button>
          <Button variant="ghost" onClick={onReset}><RotateCcw /> Đặt lại mô phỏng</Button>
        </>
      }
    />
  );
}
