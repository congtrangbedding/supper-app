"use client";
import { useEffect, useId, useMemo, useState } from "react";import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, type FieldError, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@ecommerce-os/ui/components/button";
import { Input, NativeSelect, Textarea } from "@ecommerce-os/ui/components/input";
import { Label } from "@ecommerce-os/ui/components/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@ecommerce-os/ui/components/dialog";
import { DemoBadge, PageHeader } from "@/features/content-factory/components/page-header";
import { useToast } from "@/features/content-factory/components/toast";
import { factoryCrumbs, factoryHref, type Crumb } from "@/features/content-factory/navigation";
import { useProducts } from "../hooks/use-products";
import { assetStore } from "../services/asset-store";
import { draftsFromAssets, toAsset, type ImageDraft } from "../services/image-draft";
import { blankFact, blankVariant, buildSkuIndex, createProductFormSchema, emptyFormValues, parseFeatures, productToFormValues } from "../types/form-schema";
import { PRODUCT_CATEGORIES, type Product, type ProductAsset, type ProductFormValues, type ProductInput } from "../types/product";
import { ImageUploader } from "./image-uploader";
import { LoadingView, ErrorView } from "./state-views";

function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: FieldError; hint?: string; children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode }) {
  const describedBy = [error ? id + "-error" : null, hint ? id + "-hint" : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}{required && <span aria-hidden className="text-destructive"> *</span>}{required && <span className="sr-only"> (bắt buộc)</span>}</Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && <p id={id + "-hint"} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={id + "-error"} role="alert" className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card p-4 sm:p-5">
      <h2 id={id} className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 mb-4 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function ProductForm({ productId }: { productId?: string }) {
  const state = useProducts();
  const header = (title: string, crumbs: Crumb[]) => <PageHeader title={title} crumbs={crumbs} />;
  if (state.status === "loading") return <>{header(productId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm", factoryCrumbs("products/new"))}<LoadingView /></>;
  if (state.status === "error") return <ErrorView message={state.error} onRetry={() => void state.actions.refresh()} />;
  const product = productId ? state.products.find(p => p.id === productId) : undefined;
  if (productId && !product) {
    return (
      <>
        {header("Không tìm thấy sản phẩm", factoryCrumbs("products", [{ label: "Không tìm thấy" }]))}
        <div className="rounded-lg border border-dashed bg-card p-6 text-sm">
          <p className="mb-3 text-muted-foreground">Sản phẩm có thể đã bị xóa hoặc dữ liệu demo đã được khôi phục.</p>
          <Link href={factoryHref("products")} className={buttonVariants({ variant: "outline" })}>Về danh sách sản phẩm</Link>
        </div>
      </>
    );
  }
  return <ProductFormInner product={product} products={state.products} />;
}

function ProductFormInner({ product, products }: { product?: Product; products: Product[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const { actions } = useProducts();
  const editing = Boolean(product);
  const [images, setImages] = useState<ImageDraft[]>(() => draftsFromAssets(product?.assets ?? []));
  const [imagesDirty, setImagesDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [skipGuard, setSkipGuard] = useState(false);
  const imageCount = images.length;

  const schema = useMemo(
    () => createProductFormSchema({ currentId: product?.id, existing: buildSkuIndex(products), assetCount: imageCount }),
    [product?.id, products, imageCount]
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<ProductFormValues>,
    defaultValues: product ? productToFormValues(product) : emptyFormValues(),
    mode: "onTouched"
  });
  const { register, control, handleSubmit, formState, trigger } = form;
  const { errors, isDirty, submitCount } = formState;
  const variants = useFieldArray({ control, name: "variants" });
  const facts = useFieldArray({ control, name: "facts" });
  const dirty = (isDirty || imagesDirty) && !skipGuard;
  const prefix = useId();

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const cancelHref = product ? factoryHref("products/" + product.id) : factoryHref("products");
  const crumbs = product
    ? factoryCrumbs("products", [{ label: product.name, href: cancelHref }, { label: "Chỉnh sửa" }])
    : factoryCrumbs("products/new");

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);
    try {
      const failed: string[] = [];
      const assets: ProductAsset[] = [];
      for (const draft of images) {
        if (draft.file) {
          try {
            await assetStore.put(draft.id, draft.file);
          } catch {
            failed.push(draft.name);
            continue;
          }
        }
        assets.push(toAsset(draft));
      }
      if (assets.length && !assets.some(a => a.isMain)) assets[0] = { ...assets[0], isMain: true };
      const input: ProductInput = {
        name: values.name.trim(),
        code: values.code.trim(),
        category: values.category,
        brand: values.brand.trim(),
        description: values.description.trim(),
        material: values.material.trim(),
        color: values.color.trim(),
        pattern: values.pattern.trim(),
        dimensions: values.dimensions.trim(),
        features: parseFeatures(values.featuresText),
        notes: values.notes.trim(),
        facts: values.facts.map(f => ({ ...f, label: f.label.trim(), value: f.value.trim(), evidence: f.evidence.trim() })),
        variants: values.variants.map(v => ({ ...v, sku: v.sku.trim(), color: v.color.trim(), size: v.size.trim() })),
        assets,
        status: failed.length && values.status === "ready" && assets.length === 0 ? "draft" : values.status
      };
      const kept = new Set(assets.map(a => a.id));
      const removedLocal = (product?.assets ?? []).filter(a => a.source === "local" && !kept.has(a.id)).map(a => a.id);
      const result = product ? await actions.update(product.id, input, removedLocal) : await actions.create(input);
      setSkipGuard(true);
      toast({ title: editing ? "Đã lưu thay đổi" : "Đã tạo sản phẩm", description: result.name });
      if (failed.length) toast({ tone: "error", title: "Một số ảnh chưa được lưu", description: "Trình duyệt không lưu được: " + failed.join(", ") });
      router.push(factoryHref("products/" + result.id));
    } catch (error) {
      toast({ tone: "error", title: "Không lưu được sản phẩm", description: error instanceof Error ? error.message : "Đã có lỗi không xác định." });
      setSaving(false);
    }
  }

  const errorCount = Object.keys(errors).length;
  const variantError = (index: number, key: "sku" | "color" | "size") => errors.variants?.[index]?.[key];
  const factError = (index: number, key: "label" | "value") => errors.facts?.[index]?.[key];

  return (
    <>
      <PageHeader
        title={editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
        description={editing ? "Cập nhật thông tin, phân loại SKU và ảnh của sản phẩm." : "Nhập thông tin sản phẩm. Các trường có dấu * là bắt buộc."}
        crumbs={crumbs}
        meta={<DemoBadge>DEMO · lưu trên trình duyệt này</DemoBadge>}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-4xl gap-4" aria-label={editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}>
        {submitCount > 0 && errorCount > 0 && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Còn {errorCount} mục cần sửa. Kiểm tra các trường được đánh dấu bên dưới.
          </p>
        )}

        <Section title="A. Thông tin cơ bản">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id={prefix + "name"} label="Tên sản phẩm" required error={errors.name}>{p => <Input {...p} autoComplete="off" {...register("name")} />}</Field>
            </div>
            <Field id={prefix + "code"} label="Mã sản phẩm nội bộ" required error={errors.code} hint="Duy nhất, ví dụ MH-160.">{p => <Input {...p} autoComplete="off" {...register("code")} />}</Field>
            <Field id={prefix + "category"} label="Danh mục" required error={errors.category}>
              {p => <NativeSelect {...p} {...register("category")}>{PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</NativeSelect>}
            </Field>
            <Field id={prefix + "brand"} label="Thương hiệu" error={errors.brand}>{p => <Input {...p} {...register("brand")} />}</Field>
            <Field id={prefix + "status"} label="Trạng thái" error={errors.status} hint="“Sẵn sàng” cần có phân loại SKU, ảnh và đặc tính đã xác minh.">
              {p => <NativeSelect {...p} {...register("status")}><option value="draft">Bản nháp</option><option value="ready">Sẵn sàng</option><option value="archived">Lưu trữ</option></NativeSelect>}
            </Field>
            <div className="sm:col-span-2">
              <Field id={prefix + "description"} label="Mô tả" error={errors.description}>{p => <Textarea {...p} rows={3} {...register("description")} />}</Field>
            </div>
          </div>
        </Section>

        <Section title="B. Thuộc tính sản phẩm" description="Thông tin mô tả sản phẩm. Dữ liệu bạn nhập chỉ được coi là đã xác minh khi bạn tự đánh dấu bên dưới.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={prefix + "material"} label="Chất liệu" error={errors.material}>{p => <Input {...p} {...register("material")} />}</Field>
            <Field id={prefix + "color"} label="Màu sắc" error={errors.color}>{p => <Input {...p} {...register("color")} />}</Field>
            <Field id={prefix + "pattern"} label="Họa tiết" error={errors.pattern}>{p => <Input {...p} {...register("pattern")} />}</Field>
            <Field id={prefix + "dimensions"} label="Kích thước" error={errors.dimensions}>{p => <Input {...p} {...register("dimensions")} />}</Field>
            <div className="sm:col-span-2">
              <Field id={prefix + "features"} label="Tính năng nổi bật" error={errors.featuresText} hint="Mỗi dòng một tính năng.">{p => <Textarea {...p} rows={3} {...register("featuresText")} />}</Field>
            </div>
            <div className="sm:col-span-2">
              <Field id={prefix + "notes"} label="Ghi chú chưa xác minh" error={errors.notes} hint="Ý tưởng hoặc thông tin chưa có bằng chứng. Không dùng làm dữ kiện sản xuất.">{p => <Textarea {...p} rows={2} {...register("notes")} />}</Field>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="size-4 text-success" aria-hidden /> Đặc tính đã xác minh</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => facts.append(blankFact())}><Plus /> Thêm đặc tính</Button>
            </div>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">Chỉ đánh dấu “Đã xác minh” khi bạn đã đối chiếu với sản phẩm thật hoặc chứng từ. Hệ thống không tự xác minh.</p>
            {facts.fields.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Chưa có đặc tính nào.</p>
            ) : (
              <ul className="grid gap-3">
                {facts.fields.map((field, index) => (
                  <li key={field.id} className="grid gap-3 rounded-md border bg-secondary/30 p-3 sm:grid-cols-2">
                    <Field id={prefix + "fact-label-" + index} label="Tên đặc tính" required error={factError(index, "label")}>{p => <Input {...p} {...register(`facts.${index}.label` as const)} />}</Field>
                    <Field id={prefix + "fact-value-" + index} label="Giá trị" required error={factError(index, "value")}>{p => <Input {...p} {...register(`facts.${index}.value` as const)} />}</Field>
                    <Field id={prefix + "fact-evidence-" + index} label="Nguồn / bằng chứng" hint="Ví dụ: nhãn mác, hóa đơn, đo thực tế.">{p => <Input {...p} {...register(`facts.${index}.evidence` as const)} />}</Field>
                    <div className="flex items-end justify-between gap-2">
                      <Controller
                        control={control}
                        name={`facts.${index}.verified` as const}
                        render={({ field: f }) => (
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={f.value} onChange={e => f.onChange(e.target.checked)} onBlur={f.onBlur} /> Người bán đã xác minh</label>
                        )}
                      />
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => facts.remove(index)} aria-label={"Xóa đặc tính " + (index + 1)}><Trash2 /> Xóa</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="C. Phân loại SKU" description="Mỗi phân loại có SKU riêng, không trùng với sản phẩm khác.">
          {variants.fields.length === 0 ? (
            <p className="mb-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">Chưa có phân loại nào.</p>
          ) : (
            <ul className="mb-3 grid gap-3">
              {variants.fields.map((field, index) => (
                <li key={field.id} className="grid gap-3 rounded-md border bg-secondary/30 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-start">
                  <Field id={prefix + "var-sku-" + index} label={"SKU #" + (index + 1)} required error={variantError(index, "sku")}>{p => <Input {...p} autoComplete="off" {...register(`variants.${index}.sku` as const, { onBlur: () => void trigger("variants") })} />}</Field>
                  <Field id={prefix + "var-color-" + index} label="Màu" error={variantError(index, "color")}>{p => <Input {...p} {...register(`variants.${index}.color` as const)} />}</Field>
                  <Field id={prefix + "var-size-" + index} label="Kích cỡ" error={variantError(index, "size")}>{p => <Input {...p} {...register(`variants.${index}.size` as const)} />}</Field>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive sm:mt-6" onClick={() => variants.remove(index)} aria-label={"Xóa phân loại " + (index + 1)}><Trash2 /> Xóa</Button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => variants.append(blankVariant())}><Plus /> Thêm phân loại</Button>
        </Section>

        <Section title="D. Hình ảnh sản phẩm" description="Ảnh gốc dùng làm đầu vào cho các giai đoạn sau. Ảnh lưu cục bộ trong trình duyệt (IndexedDB), không tải lên máy chủ.">
          <ImageUploader images={images} onChange={next => { setImages(next); setImagesDirty(true); }} />
        </Section>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-t bg-background/95 px-1 py-3 backdrop-blur">
          <Button type="submit" disabled={saving}><Save /> {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Lưu sản phẩm"}</Button>
          {dirty ? <Button type="button" variant="outline" onClick={() => setConfirmLeave(true)} disabled={saving}>Hủy</Button> : <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>Hủy</Link>}
          {dirty && <span className="text-xs text-muted-foreground" role="status">Có thay đổi chưa lưu</span>}
        </div>
      </form>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogTitle>Bỏ thay đổi chưa lưu?</DialogTitle>
          <DialogDescription>Các thay đổi bạn vừa nhập sẽ bị mất.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>Tiếp tục chỉnh sửa</Button>
            <Button variant="destructive" onClick={() => { setSkipGuard(true); router.push(cancelHref); }}>Bỏ thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
