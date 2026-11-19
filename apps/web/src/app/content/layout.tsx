import type { Metadata } from "next";
import { ToastProvider } from "@/features/content-factory/components/toast";

export const metadata: Metadata = { title: { template: "%s · AI Content Factory", default: "AI Content Factory" } };

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
