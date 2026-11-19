import type { Metadata } from "next";
import { ProductForm } from "@/features/products/components/product-form";

export const metadata: Metadata = { title: "Thêm sản phẩm" };

export default function NewProductPage() {
  return <ProductForm />;
}
