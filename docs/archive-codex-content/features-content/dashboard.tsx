"use client";
import Link from "next/link";
import { ArrowRight, Aperture, Clapperboard, Layers3, Plus, Stamp } from "lucide-react";
import {useDemo} from "./repository";
import {Action,Heading,Photo,SectionTitle,Tag} from "./ui";
import {coverOf} from "./model";
export function Dashboard(){
  const db=useDemo();
  const latest=db.images[0], product=db.products.find(p=>p.id===latest?.productId);
  return <><Heading title="AI Content Factory" description="Không gian sản xuất hình ảnh và video sản phẩm." actions={<Action href="/content/products/new" secondary><Plus/> Thêm sản phẩm</Action>}/>
    <div className="studio-banner"><div><span className="banner-label"><Aperture size={16}/> IMAGE FACTORY</span><h2>Xưởng hình ảnh</h2><p>Tạo bộ ảnh bán hàng từ sản phẩm, chất liệu và bộ nhận diện của bạn.</p><Action href="/content/images/new">Tạo bộ ảnh <ArrowRight/></Action></div><div className="banner-art"><Photo src="/content/cooling.jpg"/><Photo src="/content/bamboo.jpg"/><Photo src="/content/blanket.jpg"/></div></div>
    <div className="studio-shortcuts">{[[Aperture,"Dự án ảnh",db.images.length,"images"],[Clapperboard,"Dự án video",db.videos.length,"videos"],[Layers3,"Tư liệu",db.media.length,"media"],[Stamp,"Chờ duyệt",db.approvals.filter(a=>a.status==="Chờ duyệt").length,"approvals"]].map(([IconValue,title,count,path])=>{const Icon=IconValue as typeof Aperture;return <Link key={String(path)} href={"/content/"+path}><Icon size={20}/><span>{String(title)}</span><strong>{String(count)}</strong></Link>;})}</div>
    <SectionTitle title="Tiếp tục sản xuất" href="/content/images"/><div className="gallery">{db.images.slice(0,3).map(p=><Link key={p.id} className="preview-card" href={"/content/images/"+p.id+"/editor"}><Photo src={coverOf(db.products.find(x=>x.id===p.productId))}/><div><Tag>{p.status}</Tag><h3>{p.name}</h3><p>{p.slots.length} khung ảnh · {p.ratios.join(" / ")}</p></div></Link>)}</div>
    <SectionTitle title="Thư viện sản phẩm" href="/content/products"/><div className="studio-panel compact-list">{[product,...db.products.filter(p=>p.id!==product?.id)].filter(p=>!!p).slice(0,3).map(p=><Link key={p.id} href={"/content/products/"+p.id}><Photo src={coverOf(p)}/><strong>{p.name}</strong><span>{p.sku}</span><ArrowRight size={16}/></Link>)}</div></>;
}
