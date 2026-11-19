import type { Metadata } from "next";
import { ProductLibrary } from "@/features/products/components/product-library";

export const metadata: Metadata = { title: "Danh sách sản phẩm" };

export default function ProductsPage() {
  return <ProductLibrary />;
}
