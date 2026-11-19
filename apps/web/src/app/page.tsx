import Link from "next/link";
import { ArrowUpRight, ArrowRight, ScanLine, Layers, ImagePlus, PanelsTopLeft, PackageCheck, Sparkles } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";
import { Card } from "@ecommerce-os/ui/components/card";
import { Badge } from "@ecommerce-os/ui/components/badge";
import { applications } from "@/lib/workspace";
import { applicationIcons } from "@/lib/icons";

const workflow = [
  { title: "Nhập sản phẩm", text: "Ảnh gốc và thuộc tính đã xác minh", icon: ImagePlus },
  { title: "Chọn bố cục", text: "Template và tỷ lệ khung hình", icon: PanelsTopLeft },
  { title: "Sản xuất ảnh", text: "Tạo bộ ảnh và tinh chỉnh", icon: Sparkles },
  { title: "Duyệt & xuất", text: "Kiểm tra và xuất bản hoàn chỉnh", icon: PackageCheck }
];

export default function Home() {
  return <>
    <div className="intro"><h1>Tổng quan</h1><p>Chào mừng bạn đến với không gian vận hành Ecommerce OS.</p></div>
    <section className="feature" aria-labelledby="factory-title">
      <div className="feature-copy"><Badge className="feature-status"><i/> Đang phát triển</Badge>
        <h2 id="factory-title">AI Image Factory</h2><p>Từ ảnh sản phẩm thật đến bộ ảnh bán hàng đồng nhất cho từng gian hàng.</p>
        <Button asChild className="studio-button"><Link href="/content/dashboard">Khám phá mô-đun <ArrowRight/></Link></Button>
      </div>
      <div className="art" aria-hidden="true"><div className="back-sheet"/><div className="photo-sheet"><div className="photo"/><div className="proof"><ScanLine size={13}/><span>STUDIO / 01</span><div className="swatches"/></div></div><div className="cross">+</div></div>
    </section>
    <section aria-labelledby="apps-title"><div className="section-title"><Layers size={20}/><h2 id="apps-title">Ứng dụng trong hệ thống</h2></div>
      <div className="app-grid">{applications.map(app => {
        const Icon = applicationIcons[app.slug];
        const active = app.status === "in-development";
        return <Link href={"/"+app.slug} key={app.slug} className="app-link"><Card className={"module "+app.slug}>
          <div className="card-top"><span className="tile"><Icon size={21}/></span><Badge variant="secondary" className={active ? "status active" : "status"}>{active ? "Đang phát triển" : "Coming soon"}</Badge></div>
          <h3>{app.title}<ArrowUpRight size={15}/></h3><p>{app.description}</p>
        </Card></Link>;
      })}</div>
    </section>
    <section aria-labelledby="flow-title"><div className="section-title"><ScanLine size={20}/><h2 id="flow-title">Quy trình AI Image Factory</h2><span className="planned">Dự kiến</span></div>
      <ol className="flow">{workflow.map(({title,text,icon:Icon}) => <li key={title}><Icon size={18}/><strong>{title}</strong><p>{text}</p></li>)}</ol>
    </section>
  </>;
}
