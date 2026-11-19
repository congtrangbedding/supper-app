import { ASSET_LIMITS, type ProductAsset } from "../types/product";

/** An image being edited in the form. `file` is set only for images chosen in this session. */
export interface ImageDraft {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  source: "sample" | "local";
  url: string;
  isMain: boolean;
  file?: File;
  /** object URL for `file`; owned by the uploader, which revokes it */
  previewUrl?: string;
}

export function removedPreviewUrls(before: readonly ImageDraft[], after: readonly ImageDraft[]) {
  const keep = new Set(after.map(i => i.id));
  return before.filter(i => i.previewUrl && !keep.has(i.id)).map(i => i.previewUrl as string);
}

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export function validateFiles<T extends FileLike>(files: readonly T[], currentCount: number) {
  const accepted: T[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!ASSET_LIMITS.types.includes(file.type)) errors.push("“" + file.name + "”: chỉ nhận ảnh JPG, PNG hoặc WebP.");
    else if (file.size > ASSET_LIMITS.maxBytes) errors.push("“" + file.name + "”: vượt quá " + ASSET_LIMITS.maxBytes / 1024 / 1024 + " MB.");
    else if (file.size === 0) errors.push("“" + file.name + "”: tệp rỗng.");
    else if (currentCount + accepted.length >= ASSET_LIMITS.maxFiles) errors.push("“" + file.name + "”: tối đa " + ASSET_LIMITS.maxFiles + " ảnh mỗi sản phẩm.");
    else accepted.push(file);
  }
  return { accepted, errors };
}

/** Guarantees exactly one main image when the list is not empty. */
export function normalizeMain<T extends { isMain: boolean }>(images: readonly T[]): T[] {
  if (images.length === 0) return [];
  const mainIndex = Math.max(0, images.findIndex(i => i.isMain));
  return images.map((image, index) => ({ ...image, isMain: index === mainIndex }));
}

export const setMainImage = <T extends { id: string; isMain: boolean }>(images: readonly T[], id: string): T[] =>
  images.map(image => ({ ...image, isMain: image.id === id }));

export const removeImage = <T extends { id: string; isMain: boolean }>(images: readonly T[], id: string): T[] =>
  normalizeMain(images.filter(image => image.id !== id));

export function moveImage<T>(images: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return [...images];
  const next = [...images];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function draftsFromAssets(assets: readonly ProductAsset[]): ImageDraft[] {
  return assets.map(a => ({ ...a }));
}

export function toAsset(draft: ImageDraft): ProductAsset {
  return { id: draft.id, name: draft.name, size: draft.size, mimeType: draft.mimeType, source: draft.source, url: draft.source === "sample" ? draft.url : "", isMain: draft.isMain };
}
