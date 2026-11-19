import type { Metadata } from "next";
import { ProductionWorkspace } from "@/features/image-production/components/production-workspace";

export const metadata: Metadata = { title: "Xưởng sản xuất ảnh" };

export default function ImageProductionPage() {
  return <ProductionWorkspace />;
}
