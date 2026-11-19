"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Clapperboard, Eye, FolderOpen, Images, PackagePlus, Package } from "lucide-react";
import { buttonVariants } from "@ecommerce-os/ui/components/button";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { useProducts } from "@/features/products/hooks/use-products";
import { countByCategory, getReadiness, queryProducts, DEFAULT_QUERY } from "@/features/products/services/product-query";
import { ProductThumb, StatusBadge, formatDate } from "@/features/products/components/product-ui";
import { ErrorView, LoadingView } from "@/features/products/components/state-views";
import { allFactoryItems, factoryCrumbs, factoryHref } from "../navigation";
import { DemoBadge, PageHeader } from "./page-header";

const entries = [
  { slug: "products", title: "Product Studio", text: "Quản lý sản phẩm, SKU, đặc tính đã xác minh và ảnh gốc.", icon: Package },
  { slug: "images/factory", title: "Image Factory", text: "Sản xuất bộ ảnh bán hàng từ sản phẩm.", icon: Images },
  { slug: "videos/factory", title: "Video Factory", text: "Sản xuất video ngắn từ sản phẩm.", icon: Clapperboard },
  { slug: "media", title: "Media Library", text: "Kho tài nguyên ảnh và video của gian hàng.", icon: FolderOpen }
] as const;

const workflow = [
  { title: "Sản phẩm", text: "Nhập sản phẩm, SKU, ảnh gốc và đặc tính đã xác minh.", ready: true },
  { title: "Sản xuất ảnh / video", text: "Tạo bộ ảnh và video từ dữ liệu sản phẩm.", ready: false },
  { title: "Duyệt", text: "Đối chiếu bản sản xuất với đặc tính thật.", ready: false },
  { title: "Đăng bài", text: "Xuất bộ đã duyệt và liên kết sàn.", ready: false }
];

const status = [
  { done: true, label: "Điều hướng AI Content Factory" },
  { done: true, label: "Dashboard" },
  { done: true, label: "Product Studio: danh sách, thêm, sửa, xóa, chi tiết" },
  { done: false, label: "Image Factory và Image Editor" },
  { done: false, label: "Video Factory và Storyboard Editor" },
  { done: false, label: "Media Library, Batch Production, Render Jobs" },
  { done: false, label: "Duyệt nội dung và Hàng đợi đăng bài" },
  { done: false, label: "Cơ sở dữ liệu, kho tệp, AI và tích hợp Shopee" }
];

export function FactoryDashboard() {
  const { status: loadState, products, error, actions } = useProducts();
  const header = (
    <PageHeader
      title="AI Content Factory"
      description="Từ sản phẩm thật đến bộ nội dung bán hàng nhất quán. Hiện chỉ Product Studio hoạt động; các xưởng sản xuất đang được phát triển."
      crumbs={factoryCrumbs("dashboard")}
      actions={<Link href={factoryHref("products/new")} className={buttonVariants()}><PackagePlus /> Thêm sản phẩm</Link>}
    />
  );
  if (loadState === "loading") return <>{header}<LoadingView /></>;
  if (loadState === "error") return <>{header}<ErrorView message={error} onRetry={() => void actions.refresh()} /></>;

  const categories = countByCategory(products);
  const recent = queryProducts(products, DEFAULT_QUERY).slice(0, 5);
  const ready = products.filter(p => getReadiness(p).complete).length;
  const draft = products.filter(p => p.status === "draft").length;
  const soonCount = allFactoryItems.filter(i => i.status === "soon").length;

  return (
    <>
      {header}

      <section aria-labelledby="entry-title" className="mb-8">
        <h2 id="entry-title" className="mb-3 text-base font-semibold">Điểm vào sản xuất</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {entries.map(({ slug, title, text, icon: Icon }) => {
            const live = slug === "products";
            return (
              <li key={slug}>
                <Link href={factoryHref(slug)} className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                  <span className="flex items-center justify-between">
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", live ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground")}>{live ? "Đang dùng được" : "Coming soon"}</span>
                  </span>
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="flow-title" className="mb-8">
        <h2 id="flow-title" className="mb-3 text-base font-semibold">Quy trình sản xuất</h2>
        <ol className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((step, index) => (
            <li key={step.title} className="bg-card p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                <span className="grid size-5 place-items-center rounded-full bg-secondary text-xs">{index + 1}</span>{step.title}
              </p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
              <p className={cn("mt-2 text-xs font-medium", step.ready ? "text-success" : "text-muted-foreground")}>{step.ready ? "Đã triển khai" : "Chưa triển khai"}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-title" className="min-w-0 rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 id="recent-title" className="flex items-center gap-2 text-base font-semibold">Sản phẩm gần đây <DemoBadge>DEMO</DemoBadge></h2>
            <Link href={factoryHref("products")} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Xem tất cả <ArrowRight className="size-3.5" aria-hidden /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Chưa có sản phẩm. <Link className="text-primary underline" href={factoryHref("products/new")}>Thêm sản phẩm đầu tiên</Link>.</p>
          ) : (
            <ul className="divide-y">
              {recent.map(p => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <ProductThumb product={p} className="size-11 object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={factoryHref("products/" + p.id)} className="block truncate text-sm font-medium hover:underline">{p.name}</Link>
                    <p className="truncate text-xs text-muted-foreground"><span className="font-mono">{p.code}</span> · {p.category} · {formatDate(p.updatedAt)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                  <Link href={factoryHref("products/" + p.id)} aria-label={"Xem " + p.name} className="hidden rounded p-1 text-muted-foreground hover:bg-accent sm:block"><Eye className="size-4" /></Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid min-w-0 content-start gap-6">
          <section aria-labelledby="summary-title" className="rounded-lg border bg-card p-4">
            <h2 id="summary-title" className="mb-3 flex items-center gap-2 text-base font-semibold">Tổng hợp sản phẩm <DemoBadge>DEMO</DemoBadge></h2>
            <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-secondary/60 p-2"><dd className="text-xl font-semibold tabular-nums">{products.length}</dd><dt className="text-xs text-muted-foreground">Sản phẩm</dt></div>
              <div className="rounded-md bg-secondary/60 p-2"><dd className="text-xl font-semibold tabular-nums">{ready}</dd><dt className="text-xs text-muted-foreground">Đủ dữ liệu</dt></div>
              <div className="rounded-md bg-secondary/60 p-2"><dd className="text-xl font-semibold tabular-nums">{draft}</dd><dt className="text-xs text-muted-foreground">Bản nháp</dt></div>
            </dl>
            <h3 className="mb-1.5 text-sm font-medium">Theo danh mục</h3>
            {categories.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p> : (
              <ul className="grid gap-1.5">
                {categories.map(([name, count]) => (
                  <li key={name} className="grid grid-cols-[6.5rem_1fr_1.5rem] items-center gap-2 text-sm">
                    <span className="truncate">{name}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden><span className="block h-full bg-primary" style={{ width: (count / products.length) * 100 + "%" }} /></span>
                    <span className="text-right tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">“Đủ dữ liệu” = có tên, SKU, ảnh và ít nhất một đặc tính đã xác minh.</p>
          </section>

          <section aria-labelledby="dev-title" className="rounded-lg border bg-card p-4">
            <h2 id="dev-title" className="mb-3 text-base font-semibold">Tiến độ phát triển</h2>
            <ul className="grid gap-1.5 text-sm">
              {status.map(item => (
                <li key={item.label} className="flex items-start gap-2">
                  {item.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className={item.done ? "" : "text-muted-foreground"}>{item.label}<span className="sr-only">{item.done ? " — đã triển khai" : " — chưa triển khai"}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{soonCount} mục trong điều hướng đang ở trạng thái Coming soon. Không có số liệu doanh thu, render hay AI thật trong giai đoạn này.</p>
          </section>
        </div>
      </div>
    </>
  );
}
