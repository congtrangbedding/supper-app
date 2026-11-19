import { Suspense } from "react";
import { DemoBoundary } from "@/features/content/repository";
import "./studio.css";
export default function ContentLayout({children}:{children:React.ReactNode}){
  return <section className="studio"><div className="studio-context"><i/> Studio nội dung <span>Dữ liệu demo · Lưu trên trình duyệt</span></div><Suspense fallback={<p>Đang mở studio…</p>}><DemoBoundary>{children}</DemoBoundary></Suspense></section>;
}
