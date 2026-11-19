import type { Metadata } from "next";
import { ProductForm } from "@/features/products/components/product-form";

export const metadata: Metadata = { title: "Chỉnh sửa sản phẩm" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
