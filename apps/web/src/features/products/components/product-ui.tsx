"use client";
import Image from "next/image";
import { ImageOff, Package } from "lucide-react";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { Button } from "@ecommerce-os/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@ecommerce-os/ui/components/dialog";
import { useAssetUrls } from "../hooks/use-products";
import { getReadiness, mainAsset } from "../services/product-query";
import { STATUS_LABELS, type Product, type ProductAsset, type ProductStatus } from "../types/product";

const statusStyles: Record<ProductStatus, string> = {
  draft: "border-border bg-secondary text-secondary-foreground",
  ready: "border-success/30 bg-success/10 text-success",
  archived: "border-border bg-background text-muted-foreground"
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", statusStyles[status])}>{STATUS_LABELS[status]}</span>;
}

export function AssetImage({ asset, url, className, sizes }: { asset: ProductAsset; url: string | null | undefined; className?: string; sizes?: string }) {
  if (url === undefined) {
    return <div className={cn("animate-pulse bg-secondary", className)} aria-hidden />;
  }
  if (!url) {
    return (
      <div className={cn("grid place-items-center bg-secondary text-muted-foreground", className)} role="img" aria-label={"Không hiển thị được " + asset.name}>
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }
  return <Image unoptimized src={url} alt={asset.name} width={480} height={480} sizes={sizes} className={cn("object-cover", className)} />;
}

export function ProductThumb({ product, className }: { product: Pick<Product, "name" | "assets">; className?: string }) {
  const asset = mainAsset(product);
  const urls = useAssetUrls(asset ? [asset] : []);
  if (!asset) {
    return (
      <div className={cn("grid shrink-0 place-items-center rounded-md border bg-secondary text-muted-foreground", className)} role="img" aria-label={"Chưa có ảnh cho " + product.name}>
        <Package className="size-5" aria-hidden />
      </div>
    );
  }
  return <AssetImage asset={asset} url={urls[asset.id]} className={cn("shrink-0 rounded-md border", className)} />;
}

export function ReadinessBar({ product }: { product: Pick<Product, "name" | "category" | "variants" | "assets" | "facts"> }) {
  const readiness = getReadiness(product);
  return (
    <div className="flex items-center gap-2" title={readiness.checks.map(c => (c.done ? "✓ " : "○ ") + c.label).join("\n")}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" role="presentation">
        <div className={cn("h-full", readiness.complete ? "bg-success" : "bg-warning")} style={{ width: (readiness.done / readiness.total) * 100 + "%" }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{readiness.done}/{readiness.total}</span>
      <span className="sr-only">mục dữ liệu hoàn thiện</span>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>{pending ? "Đang xóa…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
}
