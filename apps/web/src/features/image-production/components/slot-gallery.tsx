"use client";
import { ImageIcon } from "lucide-react";
import { AssetImage } from "@/features/products/components/product-ui";
import { useAssetUrls } from "@/features/products/hooks/use-products";
import { mainAsset } from "@/features/products/services/product-query";
import type { Product } from "@/features/products/types/product";
import { RATIO_INFO, type FlowConfig, type FlowStatus } from "../types/production";

const SLOT_STATE: Partial<Record<FlowStatus, string>> = {
  SIMULATING: "Đang mô phỏng",
  DEMO_COMPLETED: "Mô phỏng xong · chưa có ảnh",
  DEMO_FAILED: "Mô phỏng lỗi",
  CANCELLED: "Đã hủy"
};

/** Nine planned slots. The picture shown is the product's own source photo, never a generated result. */
export function SlotGallery({ config, product, status }: { config: FlowConfig; product?: Product; status: FlowStatus }) {
  const asset = product ? mainAsset(product) : undefined;
  const urls = useAssetUrls(asset ? [asset] : []);
  const ratioText = RATIO_INFO[config.outputRatios].label;
  return (
    <div>
      <p className="mb-2 rounded-md border border-dashed bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        Đây là bộ ảnh <strong>được lên kế hoạch</strong>, chưa phải ảnh đã tạo. Ảnh trong khung là ảnh gốc của sản phẩm. Trình chỉnh sửa khung thuộc giai đoạn UI-04.
      </p>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Chín khung ảnh">
        {config.slots.map(slot => (
          <li key={slot.index} className="overflow-hidden rounded-lg border bg-card">
            <div className="relative">
              {asset ? (
                <AssetImage asset={asset} url={urls[asset.id]} className="aspect-[3/4] w-full opacity-60 grayscale-[40%]" />
              ) : (
                <div className="grid aspect-[3/4] w-full place-items-center bg-secondary text-muted-foreground" role="img" aria-label="Chưa có ảnh gốc"><ImageIcon className="size-6" aria-hidden /></div>
              )}
              <span className="absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-xs font-semibold shadow-sm">{slot.index}</span>
              <span className="absolute right-1.5 bottom-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">KẾ HOẠCH</span>
            </div>
            <div className="grid gap-0.5 p-2">
              <p className="text-xs font-medium">{slot.title}</p>
              <p className="text-[11px] text-muted-foreground">{slot.purpose}</p>
              <p className="mt-1 text-[11px]"><span className="font-mono">{slot.templateId}</span> · {ratioText}</p>
              <p className="text-[11px] text-muted-foreground">{SLOT_STATE[status] ?? "Đã cấu hình · chưa tạo ảnh"}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
