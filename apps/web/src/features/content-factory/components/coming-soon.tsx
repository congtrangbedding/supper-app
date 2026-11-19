import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { buttonVariants } from "@ecommerce-os/ui/components/button";
import { factoryCrumbs, factoryHref, type FactoryNavItem } from "../navigation";
import { PageHeader } from "./page-header";

export function ComingSoon({ item }: { item: FactoryNavItem }) {
  return (
    <>
      <PageHeader title={item.title} description={item.description} crumbs={factoryCrumbs(item.slug)} />
      <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed bg-card p-6 sm:p-10" aria-labelledby="soon-title">
        <Construction className="size-8 text-muted-foreground" aria-hidden />
        <h2 id="soon-title" className="text-lg font-semibold">Coming soon · Chưa được triển khai</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Chức năng này thuộc giai đoạn sau của lộ trình và hiện chưa hoạt động. Giao diện chưa có dữ liệu thật hay thao tác nào.
          Phần đang dùng được: Dashboard và Quản lý sản phẩm.
        </p>
        <Link href={factoryHref("products")} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft /> Về danh sách sản phẩm
        </Link>
      </section>
    </>
  );
}
