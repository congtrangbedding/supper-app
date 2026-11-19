"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, Clapperboard, Images, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@ecommerce-os/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ecommerce-os/ui/components/tabs";
import { DemoBadge, PageHeader } from "@/features/content-factory/components/page-header";
import { useToast } from "@/features/content-factory/components/toast";
import { factoryCrumbs, factoryHref } from "@/features/content-factory/navigation";
import { useAssetUrls, useProduct, useProducts } from "../hooks/use-products";
import { getReadiness } from "../services/product-query";
import type { Product } from "../types/product";
import { AssetImage, ConfirmDialog, formatBytes, formatDate, ProductThumb, StatusBadge } from "./product-ui";
import { ErrorView, LoadingView } from "./state-views";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 border-b py-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{value || <span className="text-muted-foreground">Chưa nhập</span>}</dd>
    </div>
  );
}

function Gallery({ product }: { product: Product }) {
  const urls = useAssetUrls(product.assets);
  if (product.assets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Sản phẩm chưa có ảnh. <Link className="text-primary underline" href={factoryHref("products/" + product.id + "/edit")}>Thêm ảnh</Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {product.assets.map(asset => (
        <li key={asset.id} className="overflow-hidden rounded-lg border bg-card">
          <AssetImage asset={asset} url={urls[asset.id]} className="aspect-square w-full" />
          <div className="p-2">
            <p className="truncate text-xs font-medium" title={asset.name}>{asset.name}</p>
            <p className="text-[11px] text-muted-foreground">{asset.isMain ? "Ảnh chính · " : ""}{asset.source === "sample" ? "Ảnh mẫu" : formatBytes(asset.size)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const { status, product, error } = useProduct(id);
  const { actions } = useProducts();
  const { toast } = useToast();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (status === "loading") return <><PageHeader title="Chi tiết sản phẩm" crumbs={factoryCrumbs("products", [{ label: "Đang tải…" }])} /><LoadingView /></>;
  if (status === "error") return <ErrorView message={error ?? "Lỗi không xác định."} onRetry={() => void actions.refresh()} />;
  if (!product) {
    return (
      <>
        <PageHeader title="Không tìm thấy sản phẩm" crumbs={factoryCrumbs("products", [{ label: "Không tìm thấy" }])} />
        <div className="rounded-lg border border-dashed bg-card p-6 text-sm">
          <p className="mb-3 text-muted-foreground">Sản phẩm có thể đã bị xóa hoặc dữ liệu demo đã được khôi phục.</p>
          <Link href={factoryHref("products")} className={buttonVariants({ variant: "outline" })}>Về danh sách sản phẩm</Link>
        </div>
      </>
    );
  }

  const readiness = getReadiness(product);
  const verified = product.facts.filter(f => f.verified);
  const unavailable = (what: string) => toast({ tone: "info", title: what + " chưa khả dụng", description: "Tính năng này thuộc giai đoạn sau và chưa được triển khai." });

  async function remove() {
    if (!product) return;
    setDeleting(true);
    try {
      await actions.remove([product.id]);
      toast({ title: "Đã xóa sản phẩm", description: product.name });
      router.push(factoryHref("products"));
    } catch (e) {
      toast({ tone: "error", title: "Không xóa được sản phẩm", description: e instanceof Error ? e.message : undefined });
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={product.name}
        crumbs={factoryCrumbs("products", [{ label: product.name }])}
        meta={
          <>
            <StatusBadge status={product.status} />
            <span className="font-mono text-xs text-muted-foreground">{product.code}</span>
            <span className="text-xs text-muted-foreground">· {product.category}</span>
            {product.isSample && <DemoBadge>DỮ LIỆU MẪU</DemoBadge>}
          </>
        }
        actions={
          <>
            <Link href={factoryHref("products/" + product.id + "/edit")} className={buttonVariants()}><Pencil /> Chỉnh sửa</Link>
            <Button variant="outline" onClick={() => unavailable("Tạo bộ ảnh")}><Images /> Tạo bộ ảnh <span className="rounded bg-secondary px-1 text-[10px]">Sắp có</span></Button>
            <Button variant="outline" onClick={() => unavailable("Tạo video")}><Clapperboard /> Tạo video <span className="rounded bg-secondary px-1 text-[10px]">Sắp có</span></Button>
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 /> Xóa</Button>
          </>
        }
      />

      <div className="mb-5 flex items-center gap-4 rounded-lg border bg-card p-3">
        <ProductThumb product={product} className="size-20 object-cover" />
        <p className="text-sm text-muted-foreground">Cập nhật {formatDate(product.updatedAt)} · tạo {formatDate(product.createdAt)}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList aria-label="Nội dung chi tiết sản phẩm">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="variants">Phân loại SKU ({product.variants.length})</TabsTrigger>
          <TabsTrigger value="images">Hình ảnh sản phẩm ({product.assets.length})</TabsTrigger>
          <TabsTrigger value="facts">Đặc tính đã xác minh ({verified.length}/{product.facts.length})</TabsTrigger>
          <TabsTrigger value="history">Lịch sử nội dung</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <section aria-labelledby="ov-info" className="rounded-lg border bg-card p-4">
            <h2 id="ov-info" className="mb-2 text-base font-semibold">Thông tin sản phẩm</h2>
            <dl>
              <Info label="Thương hiệu" value={product.brand} />
              <Info label="Mô tả" value={product.description} />
              <Info label="Chất liệu" value={product.material} />
              <Info label="Màu sắc" value={product.color} />
              <Info label="Họa tiết" value={product.pattern} />
              <Info label="Kích thước" value={product.dimensions} />
              <Info label="Tính năng" value={product.features.join(" · ")} />
              <Info label="Ghi chú chưa xác minh" value={product.notes} />
            </dl>
          </section>
          <section aria-labelledby="ov-ready" className="h-fit rounded-lg border bg-card p-4">
            <h2 id="ov-ready" className="mb-2 text-base font-semibold">Mức sẵn sàng · {readiness.done}/{readiness.total}</h2>
            <ul className="grid gap-1.5 text-sm">
              {readiness.checks.map(check => (
                <li key={check.key} className="flex items-center gap-2">
                  {check.done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <CircleDashed className="size-4 text-muted-foreground" aria-hidden />}
                  <span>{check.label}</span>
                  <span className="sr-only">{check.done ? "đã đủ" : "chưa đủ"}</span>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="variants">
          {product.variants.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Chưa có phân loại. <Link className="text-primary underline" href={factoryHref("products/" + product.id + "/edit")}>Thêm phân loại</Link></p>
          ) : (
            <div className="relative overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[420px] text-left text-sm">
                <caption className="sr-only">Phân loại SKU của {product.name}</caption>
                <thead className="border-b bg-secondary/60 text-xs text-muted-foreground"><tr><th scope="col" className="px-3 py-2 font-medium">SKU</th><th scope="col" className="px-3 py-2 font-medium">Màu</th><th scope="col" className="px-3 py-2 font-medium">Kích cỡ</th></tr></thead>
                <tbody className="divide-y">{product.variants.map(v => <tr key={v.id}><td className="px-3 py-2 font-mono text-xs">{v.sku}</td><td className="px-3 py-2">{v.color || "—"}</td><td className="px-3 py-2">{v.size || "—"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="images"><Gallery product={product} /></TabsContent>

        <TabsContent value="facts" className="grid gap-4">
          <p className="text-sm text-muted-foreground">Chỉ các đặc tính được người bán đánh dấu “Đã xác minh” mới được coi là dữ kiện. Hệ thống không tự xác minh.</p>
          {product.facts.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Chưa có đặc tính. <Link className="text-primary underline" href={factoryHref("products/" + product.id + "/edit")}>Thêm đặc tính</Link></p>
          ) : (
            <ul className="grid gap-2">
              {product.facts.map(f => (
                <li key={f.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
                  <div className="min-w-0"><p className="font-medium">{f.label}: <span className="font-normal">{f.value}</span></p>{f.evidence && <p className="text-xs text-muted-foreground">Nguồn: {f.evidence}</p>}</div>
                  <span className={f.verified ? "inline-flex items-center gap-1 text-xs font-medium text-success" : "inline-flex items-center gap-1 text-xs text-muted-foreground"}>
                    {f.verified ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}{f.verified ? "Đã xác minh" : "Chưa xác minh"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-lg border border-dashed bg-card p-6">
            <h2 className="text-base font-semibold">Coming soon · Lịch sử nội dung</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Các bộ ảnh, video và phiên bản đã sản xuất cho sản phẩm này sẽ hiển thị tại đây khi Image Factory và Video Factory được triển khai. Hiện chưa có dữ liệu.</p>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={open => { if (!deleting) setConfirmDelete(open); }}
        title="Xóa sản phẩm?"
        description={"“" + product.name + "” sẽ bị xóa cùng ảnh đã lưu trong trình duyệt. Thao tác này không hoàn tác được."}
        confirmLabel="Xóa"
        pending={deleting}
        onConfirm={() => void remove()}
      />
    </>
  );
}
