"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Plus, UploadCloud, ArrowUp, ArrowDown, X, Star} from "lucide-react";
import {Button} from "@ecommerce-os/ui/components/button";
import {useDemo,updateDemo} from "./repository";
import {blankProduct} from "./fixtures";
import {categories,coverOf,filterProducts,moveItem,uid,validateProduct,variants,type Product} from "./model";
import {Action,Heading,Photo,Empty,Field,Select,Tag,dataUrl} from "./ui";

export function Products(){
  const db=useDemo();const [query,setQuery]=useState("");const [category,setCategory]=useState("");
  const rows=filterProducts(db.products,query,category);
  return <><Heading title="Thư viện sản phẩm" description="Quản lý tư liệu gốc và các biến thể dùng trong studio." actions={<Action href="/content/products/new"><Plus/> Tạo sản phẩm</Action>}/>
  <div className="filters"><Field label="Tìm sản phẩm"><input type="search" placeholder="Tên sản phẩm hoặc SKU" value={query} onChange={e=>setQuery(e.target.value)}/></Field><Field label="Danh mục"><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tất cả danh mục</option>{categories.map(c=><option key={c}>{c}</option>)}</select></Field></div>
  <div className="gallery">{rows.map(p=><article className="preview-card" key={p.id}><Link href={"/content/products/"+p.id}><Photo src={coverOf(p)} alt={p.name}/></Link><div><div className="line"><small>{p.sku}</small><Tag>{p.status}</Tag></div><h3><Link href={"/content/products/"+p.id}>{p.name}</Link></h3><p>{p.category} · {variants(p).length} biến thể</p><div className="card-actions"><Link href={"/content/images/new?product="+p.id}>Tạo bộ ảnh</Link><Link href={"/content/videos/new?product="+p.id}>Tạo video</Link><Link href={"/content/products/"+p.id+"/edit"}>Sửa</Link></div></div></article>)}</div>{!rows.length&&<Empty>Không có sản phẩm khớp bộ lọc.</Empty>}</>;
}
export function ProductDetails({id}:{id:string}){
 const p=useDemo().products.find(p=>p.id===id);if(!p)return <Empty>Không tìm thấy sản phẩm. <Link href="/content/products">Về thư viện</Link></Empty>;
 return <><Heading title={p.name} description={p.sku+" · "+p.category} actions={<Action secondary href={"/content/products/"+id+"/edit"}>Sửa sản phẩm</Action>}/><div className="split"><div className="studio-panel"><Photo src={coverOf(p)} alt={p.name}/><div className="thumb-row">{p.photos.slice(1).map((src,i)=><Photo key={i} src={src}/>)}</div></div><div className="studio-panel stack"><Tag>{p.status}</Tag><h2>{p.brand}</h2><p>{p.description}</p><dl>{[["Chất liệu",p.material],["Màu sắc",p.color],["Họa tiết",p.pattern],["Kích thước",p.dimensions],["Thuộc tính đã xác minh",p.facts]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||"Chưa nhập"}</dd></div>)}</dl><h3>Biến thể</h3>{variants(p).map(v=><p key={v.sku}>{v.name} · {v.sku}</p>)}<div className="actions"><Action href={"/content/images/new?product="+id}>Tạo bộ ảnh</Action><Action secondary href={"/content/videos/new?product="+id}>Tạo video</Action></div></div></div></>;
}
export function ProductForm({id}:{id?:string}){
 const db=useDemo();const original=db.products.find(p=>p.id===id);const router=useRouter();
 const [draft,set]=useState<Product>(()=>original??{...blankProduct(),id:uid()});const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 function edit<K extends keyof Product>(key:K,value:Product[K]){set(p=>({...p,[key]:value}));}
 function field(k:keyof Omit<Product,"photos">,label:string,required=false){return <Field key={k} label={label}><input required={required} value={draft[k]} onChange={e=>edit(k,e.target.value)}/></Field>;}
 async function upload(files:FileList|null){if(!files?.length)return;setBusy(true);setError("");try{const list=Array.from(files);if(list.some(f=>!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>1500000))throw Error("Chọn ảnh JPG, PNG hoặc WebP dưới 1,5 MB.");const photos=await Promise.all(list.map(dataUrl));set(p=>({...p,photos:[...p.photos,...photos]}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function submit(e:FormEvent){e.preventDefault();const issue=validateProduct(draft,db.products);setError(issue);if(issue)return;const p={...draft,name:draft.name.trim(),sku:draft.sku.trim()};updateDemo(s=>({...s,products:[p,...s.products.filter(x=>x.id!==p.id)]}));router.push("/content/products/"+p.id);}
 if(id&&!original)return <Empty>Không tìm thấy sản phẩm để sửa.</Empty>;
 return <><Heading title={id?"Sửa sản phẩm":"Tạo sản phẩm"} description="Thông tin và ảnh gốc được lưu trong trình duyệt này."/><form className="stack" onSubmit={submit}>
 <section className="studio-panel"><h2>Thông tin cơ bản</h2><div className="form-grid">{field("name","Tên sản phẩm",true)}{field("sku","SKU nội bộ",true)}<Select label="Danh mục" value={draft.category} options={categories} onChange={v=>edit("category",v)}/>{field("brand","Thương hiệu")}<Field label="Mô tả"><textarea value={draft.description} onChange={e=>edit("description",e.target.value)}/></Field><Select label="Trạng thái" value={draft.status} options={["Bản nháp","Sẵn sàng"]} onChange={v=>edit("status",v)}/></div></section>
 <section className="studio-panel"><h2>Thuộc tính sản phẩm</h2><div className="form-grid">{field("material","Chất liệu")}{field("color","Màu sắc")}{field("pattern","Họa tiết")}{field("dimensions","Kích thước")}{field("facts","Đặc điểm đã xác minh")}</div></section>
 <section className="studio-panel"><h2>Biến thể</h2><div className="form-grid">{field("colors","Các màu (phân tách bằng dấu phẩy)")}{field("sizes","Các kích cỡ (phân tách bằng dấu phẩy)")}</div><div className="chips">{variants(draft).map(v=><Tag key={v.sku}>{v.name} · {v.sku}</Tag>)}</div></section>
 <section className="studio-panel"><h2>Ảnh sản phẩm</h2><label className="upload-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(e.dataTransfer.files);}}><UploadCloud/>Kéo thả hoặc chọn ảnh JPG, PNG, WebP<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>void upload(e.target.files)}/></label>
 <div className="photo-list">{draft.photos.map((src,i)=><div key={i}><Photo src={src} alt={"Ảnh "+(i+1)}/><small>{i===0?"Ảnh chính":"Ảnh "+(i+1)}</small><div className="actions">{[[Star,"Đặt làm ảnh chính",0],[ArrowUp,"Chuyển lên",i-1],[ArrowDown,"Chuyển xuống",i+1]].map(([I,label,target])=>{const Icon=I as typeof Star;return <button type="button" key={String(label)} aria-label={String(label)} disabled={Number(target)===i||Number(target)<0||Number(target)>=draft.photos.length} onClick={()=>edit("photos",moveItem(draft.photos,i,Number(target)))}><Icon size={15}/></button>;})}<button type="button" aria-label="Xóa ảnh" onClick={()=>edit("photos",draft.photos.filter((_,j)=>j!==i))}><X size={15}/></button></div></div>)}</div></section>
 {error&&<p role="alert" className="notice">{error}</p>}<div className="actions"><Button disabled={busy} type="submit">{busy?"Đang đọc ảnh…":"Lưu sản phẩm"}</Button><Action secondary href="/content/products">Hủy</Action></div></form></>;
}
