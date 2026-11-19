"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, PackagePlus, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@ecommerce-os/ui/components/button";
import { Input, NativeSelect } from "@ecommerce-os/ui/components/input";
import { Label } from "@ecommerce-os/ui/components/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@ecommerce-os/ui/components/dropdown-menu";
import { DemoBadge, PageHeader } from "@/features/content-factory/components/page-header";
import { useToast } from "@/features/content-factory/components/toast";
import { factoryCrumbs, factoryHref } from "@/features/content-factory/navigation";
import { useProducts } from "../hooks/use-products";
import { DEFAULT_QUERY, isFiltered, queryProducts, SORT_LABELS, type ProductQuery, type SortKey } from "../services/product-query";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, STATUS_LABELS, type Product, type ProductCategory, type ProductStatus } from "../types/product";
import { ConfirmDialog, formatDate, ProductThumb, ReadinessBar, StatusBadge } from "./product-ui";
import { ErrorView, LoadingView, NoticeBanner } from "./state-views";

const detailHref = (id: string) => factoryHref("products/" + id);
const editHref = (id: string) => factoryHref("products/" + id + "/edit");

function RowMenu({ product, onDelete }: { product: Product; onDelete: (product: Product) => void }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={"Thao tác cho " + product.name}><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => router.push(detailHref(product.id))}><Eye /> Xem chi tiết</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(editHref(product.id))}><Pencil /> Chỉnh sửa</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(product)}><Trash2 /> Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: (checked: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" className="size-4 accent-primary" checked={checked} onChange={event => onChange(event.target.checked)} aria-label={label} />;
}

export function ProductLibrary() {
  const { status, products, notice, error, actions } = useProducts();
  const { toast } = useToast();
  const [query, setQuery] = useState<ProductQuery>(DEFAULT_QUERY);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Product[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const feedbackId = useId();

  const rows = useMemo(() => queryProducts(products, query), [products, query]);
  const existingIds = useMemo(() => new Set(products.map(p => p.id)), [products]);
  const selectedIds = useMemo(() => [...selected].filter(id => existingIds.has(id)), [selected, existingIds]);
  const visibleSelected = rows.filter(p => selected.has(p.id)).length;
  const allVisible = rows.length > 0 && visibleSelected === rows.length;
  const update = (patch: Partial<ProductQuery>) => setQuery(current => ({ ...current, ...patch }));

  function toggle(id: string, checked: boolean) {
    setSelected(current => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function toggleAllVisible(checked: boolean) {
    setSelected(current => {
      const next = new Set(current);
      for (const p of rows) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await actions.remove(pendingDelete.map(p => p.id));
      setSelected(current => {
        const next = new Set(current);
        pendingDelete.forEach(p => next.delete(p.id));
        return next;
      });
      toast({ title: "Đã xóa " + pendingDelete.length + " sản phẩm", description: pendingDelete.length === 1 ? pendingDelete[0].name : undefined });
      setPendingDelete(null);
    } catch (e) {
      toast({ tone: "error", title: "Không xóa được sản phẩm", description: e instanceof Error ? e.message : undefined });
    } finally {
      setDeleting(false);
    }
  }

  async function resetDemo() {
    try {
      await actions.reset();
      setSelected(new Set());
      setQuery(DEFAULT_QUERY);
      toast({ title: "Đã khôi phục dữ liệu mẫu" });
    } catch (e) {
      toast({ tone: "error", title: "Không khôi phục được dữ liệu", description: e instanceof Error ? e.message : undefined });
    }
  }

  const header = (
    <PageHeader
      title="Danh sách sản phẩm"
      description="Quản lý sản phẩm, phân loại SKU và ảnh gốc làm đầu vào cho sản xuất nội dung."
      crumbs={factoryCrumbs("products")}
      meta={
        <>
          <span className="text-sm text-muted-foreground" aria-live="polite">{status === "ready" ? products.length + " sản phẩm" : "Đang tải…"}</span>
          <DemoBadge>DEMO · dữ liệu mẫu lưu trên trình duyệt</DemoBadge>
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => void resetDemo()} disabled={status !== "ready"}><RotateCcw /> Khôi phục dữ liệu mẫu</Button>
          <Link href={factoryHref("products/new")} className={buttonVariants()}><PackagePlus /> Thêm sản phẩm</Link>
        </>
      }
    />
  );

  if (status === "loading") return <>{header}<LoadingView /></>;
  if (status === "error") return <>{header}<ErrorView message={error} onRetry={() => void actions.refresh()} /></>;

  const filtered = isFiltered(query);

  return (
    <>
      {header}
      {notice && <NoticeBanner>{notice}</NoticeBanner>}

      <form role="search" aria-label="Tìm và lọc sản phẩm" onSubmit={event => event.preventDefault()} className="mb-3 grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="product-search">Tìm kiếm</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
            <Input id="product-search" type="search" className="pl-8" placeholder="Tên, mã sản phẩm hoặc SKU" value={query.search} onChange={e => update({ search: e.target.value })} aria-describedby={feedbackId} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-category">Danh mục</Label>
          <NativeSelect id="filter-category" value={query.category} onChange={e => update({ category: e.target.value as ProductCategory | "all" })}>
            <option value="all">Tất cả danh mục</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-status">Trạng thái</Label>
          <NativeSelect id="filter-status" value={query.status} onChange={e => update({ status: e.target.value as ProductStatus | "all" })}>
            <option value="all">Tất cả trạng thái</option>
            {PRODUCT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sort">Sắp xếp</Label>
          <NativeSelect id="sort" value={query.sort} onChange={e => update({ sort: e.target.value as SortKey })}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map(key => <option key={key} value={key}>{SORT_LABELS[key]}</option>)}
          </NativeSelect>
        </div>
        <Button type="button" variant="ghost" onClick={() => setQuery(DEFAULT_QUERY)} disabled={!filtered && query.sort === DEFAULT_QUERY.sort}><X /> Xóa bộ lọc</Button>
      </form>

      <p id={feedbackId} role="status" className="mb-2 text-sm text-muted-foreground">
        {filtered ? "Tìm thấy " + rows.length + " / " + products.length + " sản phẩm." : "Hiển thị " + rows.length + " sản phẩm."}
      </p>

      {selectedIds.length > 0 && (
        <div role="region" aria-label="Thao tác hàng loạt" className="sticky top-2 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-accent px-3 py-2 text-sm">
          <strong>{selectedIds.length} đã chọn</strong>
          <span className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
            <Button size="sm" variant="destructive" onClick={() => setPendingDelete(products.filter(p => selected.has(p.id)))}><Trash2 /> Xóa đã chọn</Button>
          </span>
        </div>
      )}

      {products.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed bg-card p-8">
          <h2 className="text-lg font-semibold">Chưa có sản phẩm</h2>
          <p className="text-sm text-muted-foreground">Thêm sản phẩm đầu tiên hoặc khôi phục bộ dữ liệu mẫu để thử giao diện.</p>
          <div className="flex gap-2">
            <Link href={factoryHref("products/new")} className={buttonVariants()}><PackagePlus /> Thêm sản phẩm</Link>
            <Button variant="outline" onClick={() => void resetDemo()}><RotateCcw /> Khôi phục dữ liệu mẫu</Button>
          </div>
        </section>
      ) : rows.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed bg-card p-8">
          <h2 className="text-lg font-semibold">Không có sản phẩm phù hợp</h2>
          <p className="text-sm text-muted-foreground">Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
          <Button variant="outline" onClick={() => setQuery(DEFAULT_QUERY)}>Xóa bộ lọc</Button>
        </section>
      ) : (
        <>
          <div className="relative hidden overflow-x-auto rounded-lg border bg-card md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Danh sách sản phẩm</caption>
              <thead className="border-b bg-secondary/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2"><Checkbox checked={allVisible} indeterminate={visibleSelected > 0 && !allVisible} onChange={toggleAllVisible} label="Chọn tất cả sản phẩm đang hiển thị" /></th>
                  <th scope="col" className="px-3 py-2 font-medium">Sản phẩm</th>
                  <th scope="col" className="px-3 py-2 font-medium">Mã nội bộ</th>
                  <th scope="col" className="px-3 py-2 font-medium">Danh mục</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Phân loại</th>
                  <th scope="col" className="px-3 py-2 font-medium">Đặc tính xác minh</th>
                  <th scope="col" className="px-3 py-2 font-medium">Cập nhật</th>
                  <th scope="col" className="px-3 py-2 font-medium">Trạng thái</th>
                  <th scope="col" className="w-12 px-3 py-2"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(p => {
                  const verified = p.facts.filter(f => f.verified).length;
                  return (
                    <tr key={p.id} className={selected.has(p.id) ? "bg-accent/50" : "hover:bg-secondary/40"}>
                      <td className="px-3 py-2"><Checkbox checked={selected.has(p.id)} onChange={checked => toggle(p.id, checked)} label={"Chọn " + p.name} /></td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumb product={p} className="size-11 object-cover" />
                          <div className="min-w-0">
                            <Link href={detailHref(p.id)} className="block max-w-64 truncate font-medium hover:underline" title={p.name}>{p.name}</Link>
                            {p.isSample && <DemoBadge>MẪU</DemoBadge>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.variants.length}</td>
                      <td className="px-3 py-2">
                        <span className="tabular-nums">{verified}/{p.facts.length}</span>
                        <span className="ml-1 text-xs text-muted-foreground">đã xác minh</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.updatedAt)}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-2"><RowMenu product={p} onDelete={product => setPendingDelete([product])} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-2 md:hidden" aria-label="Danh sách sản phẩm dạng thẻ">
            <li className="flex items-center gap-2 px-1 text-sm">
              <Checkbox checked={allVisible} indeterminate={visibleSelected > 0 && !allVisible} onChange={toggleAllVisible} label="Chọn tất cả sản phẩm đang hiển thị" />
              <span className="text-muted-foreground">Chọn tất cả đang hiển thị</span>
            </li>
            {rows.map(p => (
              <li key={p.id} className={"rounded-lg border bg-card p-3 " + (selected.has(p.id) ? "border-primary/50 bg-accent/50" : "")}>
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected.has(p.id)} onChange={checked => toggle(p.id, checked)} label={"Chọn " + p.name} />
                  <ProductThumb product={p} className="size-14 object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={detailHref(p.id)} className="line-clamp-2 font-medium hover:underline">{p.name}</Link>
                    <p className="font-mono text-xs text-muted-foreground">{p.code} · {p.category}</p>
                  </div>
                  <RowMenu product={p} onDelete={product => setPendingDelete([product])} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <StatusBadge status={p.status} />
                  <span>{p.variants.length} phân loại</span>
                  <span>{p.facts.filter(f => f.verified).length}/{p.facts.length} đã xác minh</span>
                  <span>Cập nhật {formatDate(p.updatedAt)}</span>
                  {p.isSample && <DemoBadge>MẪU</DemoBadge>}
                </div>
                <div className="mt-2"><ReadinessBar product={p} /></div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => { if (!open && !deleting) setPendingDelete(null); }}
        title={pendingDelete && pendingDelete.length > 1 ? "Xóa " + pendingDelete.length + " sản phẩm?" : "Xóa sản phẩm?"}
        description={(pendingDelete?.length === 1 ? "“" + pendingDelete[0].name + "” sẽ bị xóa" : "Các sản phẩm đã chọn sẽ bị xóa") + " cùng ảnh đã lưu trong trình duyệt. Thao tác này không hoàn tác được; có thể khôi phục bộ dữ liệu mẫu bằng nút “Khôi phục dữ liệu mẫu”."}
        confirmLabel="Xóa"
        pending={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
