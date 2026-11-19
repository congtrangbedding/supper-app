import type { Metadata } from "next";
import { FactoryDashboard } from "@/features/content-factory/components/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <FactoryDashboard />;
}
