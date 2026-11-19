import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = { title: "Ecommerce OS", description: "Không gian vận hành thương mại điện tử nội bộ." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><a className="skip" href="#main">Đến nội dung</a>
    <aside className="sidebar"><Navigation/></aside>
    <div className="workspace"><Header/><PageContainer>{children}</PageContainer></div>
  </body></html>;
}
