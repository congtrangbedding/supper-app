"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { useAssetUrls } from "../hooks/use-products";
import { moveImage, normalizeMain, removedPreviewUrls, removeImage, setMainImage, toAsset, validateFiles, type ImageDraft } from "../services/image-draft";
import { newId } from "../types/form-schema";
import { ASSET_LIMITS } from "../types/product";
import { AssetImage, formatBytes } from "./product-ui";

interface Props {
  images: ImageDraft[];
  onChange: (images: ImageDraft[]) => void;
}

/**
 * Client-side only picker. Chosen files stay in memory; previews use object URLs that are
 * revoked when the image is removed or the component unmounts. Nothing is uploaded.
 */
export function ImageUploader({ images, onChange }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);
  useEffect(() => () => latest.current.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl)), []);

  const storedAssets = useMemo(() => images.filter(i => !i.file).map(toAsset), [images]);
  const storedUrls = useAssetUrls(storedAssets);

  function commit(next: ImageDraft[]) {
    removedPreviewUrls(images, next).forEach(url => URL.revokeObjectURL(url));
    onChange(next);
  }

  function addFiles(list: FileList | File[]) {
    const { accepted, errors: found } = validateFiles(Array.from(list), images.length);
    setErrors(found);
    if (!accepted.length) return;
    const added: ImageDraft[] = accepted.map(file => ({
      id: newId("asset"), name: file.name, size: file.size, mimeType: file.type, source: "local", url: "", isMain: false, file, previewUrl: URL.createObjectURL(file)
    }));
    onChange(normalizeMain([...images, ...added]));
  }

  return (
    <div className="grid gap-3">
      <div
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
        className={cn("flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center", dragging ? "border-primary bg-accent" : "bg-secondary/40")}
      >
        <UploadCloud className="size-7 text-muted-foreground" aria-hidden />
        <p className="text-sm">Kéo thả ảnh vào đây hoặc</p>
        <input id={inputId} ref={inputRef} type="file" accept={ASSET_LIMITS.types.join(",")} multiple className="sr-only" tabIndex={-1} aria-label="Chọn ảnh sản phẩm" onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><ImagePlus /> Chọn ảnh từ máy</Button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP · tối đa {ASSET_LIMITS.maxBytes / 1024 / 1024} MB mỗi ảnh · tối đa {ASSET_LIMITS.maxFiles} ảnh. Ảnh chỉ lưu trong trình duyệt này (demo), không tải lên máy chủ.</p>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-0.5 rounded-md border border-destructive/40 bg-destructive/5 py-2 pr-3 pl-7 text-sm text-destructive">
          {errors.map(message => <li key={message}>{message}</li>)}
        </ul>
      )}

      <p className="text-sm text-muted-foreground" role="status">{images.length} / {ASSET_LIMITS.maxFiles} ảnh{images.length ? " · chọn một ảnh làm ảnh chính" : ""}</p>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => {
            const url = image.file ? image.previewUrl : image.source === "sample" ? image.url : storedUrls[image.id];
            return (
              <li key={image.id} className={cn("overflow-hidden rounded-lg border bg-card", image.isMain && "ring-2 ring-primary")}>
                <AssetImage asset={toAsset(image)} url={url} className="aspect-square w-full" />
                <div className="grid gap-1.5 p-2">
                  <p className="truncate text-xs font-medium" title={image.name}>{image.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(image.size)}{image.isMain ? " · Ảnh chính" : ""}</p>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon-sm" variant={image.isMain ? "default" : "outline"} aria-pressed={image.isMain} aria-label={"Đặt " + image.name + " làm ảnh chính"} onClick={() => commit(setMainImage(images, image.id))}><Star /></Button>
                    <Button type="button" size="icon-sm" variant="outline" aria-label={"Chuyển " + image.name + " lên trước"} disabled={index === 0} onClick={() => commit(moveImage(images, index, index - 1))}><ArrowUp /></Button>
                    <Button type="button" size="icon-sm" variant="outline" aria-label={"Chuyển " + image.name + " xuống sau"} disabled={index === images.length - 1} onClick={() => commit(moveImage(images, index, index + 1))}><ArrowDown /></Button>
                    <Button type="button" size="icon-sm" variant="outline" className="ml-auto text-destructive" aria-label={"Xóa " + image.name} onClick={() => commit(removeImage(images, image.id))}><Trash2 /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
