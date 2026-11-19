"use client";
import {useState} from "react";
import Link from "next/link";
import {Button} from "@ecommerce-os/ui/components/button";
import {Minus,Plus,Maximize2,ArrowLeft,RotateCcw} from "lucide-react";
import {coverOf,initialSlots,jobProgress,makeJob,reviewProject,slotNames,uid,type Product,type Slot} from "./model";
import {useDemo,updateDemo} from "./repository";
import {Empty,Field,Heading,Modal,Photo,Select,Tag,downloadJson} from "./ui";
import {useClock} from "./time";

export function Composition({slot,product,ratio,brand,zoom=100}:{slot:Slot;product:Product;ratio:string;brand:string;zoom?:number}){
 return <div className={"composition tpl-"+slot.template} style={{aspectRatio:ratio.replace(":"," / "),backgroundColor:slot.background,transform:"scale("+zoom/100+")",fontFamily:slot.font,textAlign:slot.align}}>
 <div className="composition-photo" style={{borderRadius:slot.border?"4px":0}}><Photo src={coverOf(product)} alt={product.name}/><div className="placed-photo" style={{backgroundImage:"url("+JSON.stringify(coverOf(product))+")",backgroundSize:"cover",backgroundPosition:"center",transform:"translate("+(slot.x-50)+"%, "+(slot.y-50)+"%) scale("+slot.scale/100+")"}}/></div>
 <div className="composition-copy">{slot.logo&&<small>{brand}</small>}<strong>{slot.headline}</strong><span>{slot.subtitle}</span><em>{slot.facts}</em></div></div>;
}
export function ImageEditor({id}:{id:string}){
 const db=useDemo(),project=db.images.find(p=>p.id===id),product=db.products.find(p=>p.id===project?.productId);
 const [slots,setSlots]=useState(()=>project?.slots??[]),[index,select]=useState(0),[ratio,setRatio]=useState(project?.ratios[0]??"1:1"),[zoom,setZoom]=useState(100),[modal,setModal]=useState(""),[message,setMessage]=useState(""),[jobId,setJobId]=useState("");const now=useClock();
 if(!project||!product)return <Empty>Dự án không có trong trình duyệt này. <Link href="/content/images">Mở danh sách dự án</Link></Empty>;
 const p=project,prod=product,slot=slots[index],templates=db.templates.filter(t=>t.kind==="image"),job=db.jobs.find(j=>j.id===jobId);
 function change(patch:Partial<Slot>){setSlots(list=>list.map((v,i)=>i===index?{...v,...patch}:v));setMessage("Có thay đổi chưa lưu");}
 function save(action:string,status="Bản nháp"){
  const time=new Date().toLocaleTimeString("vi-VN");
  updateDemo(s=>({...s,images:s.images.map(v=>v.id===id?{...v,slots,status,history:[time+" · "+action,...v.history]}:v)}));setMessage(action);
 }
 function review(status:"Đã duyệt"|"Chờ duyệt"){
  save(status,status);updateDemo(s=>reviewProject(s,{id:uid(),kind:"image",name:p.name,projectId:id,productId:p.productId,status,notes:""}));
 }
 function render(){const j=makeJob(p.productId,"Bộ ảnh",slots.length,slot.template);review("Chờ duyệt");updateDemo(s=>({...s,jobs:[j,...s.jobs]}));setJobId(j.id);setMessage("Đang mô phỏng render");}
 const range=(label:string,key:"scale"|"x"|"y",min:number,max:number)=><Field label={label+" · "+slot[key]+"%"}><input type="range" min={min} max={max} value={slot[key]} onChange={e=>change({[key]:Number(e.target.value)})}/></Field>;
 return <><Link className="text-link" href="/content/images"><ArrowLeft size={14}/> Dự án ảnh</Link><Heading title={p.name} actions={<Tag>{p.status}</Tag>}/><div className="editor-tools"><Button onClick={()=>save("Đã lưu bản nháp")}>Lưu nháp</Button><Button variant="outline" onClick={()=>setModal("preview")}>Xem trước</Button><Button variant="outline" onClick={render}>Render demo</Button><Button variant="outline" onClick={()=>review("Đã duyệt")}>Phê duyệt</Button><Button variant="outline" onClick={()=>setModal("export")}>Xuất</Button></div>
 <p className="feedback" role="status">{job?"Render mô phỏng · "+jobProgress(job,now)+"%":message}</p>
 <div className="edit-grid"><aside className="studio-panel rail"><h3>Bộ ảnh · 09</h3><Select label="Tỷ lệ xem" value={ratio} options={["1:1","3:4"]} onChange={setRatio}/><Field label="Mẫu bố cục"><select value={slot.template} onChange={e=>change({template:e.target.value})}>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
 <div className="slot-list">{slotNames.map((label,i)=><button key={label} aria-pressed={index===i} onClick={()=>select(i)}><span className="mini-slot" style={{backgroundColor:slots[i].background}}><Photo src={coverOf(prod)}/><b>{String(i+1).padStart(2,"0")}</b></span><span>{label}</span></button>)}</div></aside>
 <section className="canvas-panel"><div className="line"><strong>{slotNames[index]}</strong><Tag>{ratio}</Tag></div><div className="stage"><Composition slot={slot} product={prod} ratio={ratio} brand={db.brand.name} zoom={zoom}/></div><div className="zoom"><button aria-label="Thu nhỏ" disabled={zoom<=50} onClick={()=>setZoom(zoom-10)}><Minus/></button>{zoom}%<button aria-label="Phóng to" disabled={zoom>=150} onClick={()=>setZoom(zoom+10)}><Plus/></button><button aria-label="Vừa khung" onClick={()=>setZoom(100)}><Maximize2/></button></div></section>
 <aside className="studio-panel rail"><h3>Thuộc tính ảnh</h3>{([["headline","Tiêu đề"],["subtitle","Phụ đề"],["facts","Đặc điểm sản phẩm"]] as const).map(([key,label])=><Field key={key} label={label}><textarea rows={2} value={slot[key]} onChange={e=>change({[key]:e.target.value})}/></Field>)}<Field label="Màu nền"><input type="color" value={slot.background} onChange={e=>change({background:e.target.value})}/></Field><Select label="Phông chữ" value={slot.font} options={["Georgia","Arial","monospace"]} onChange={font=>change({font})}/><Field label="Căn chữ"><select value={slot.align} onChange={e=>change({align:e.target.value as Slot["align"]})}><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></Field>{range("Tỷ lệ sản phẩm","scale",50,200)}{range("Vị trí ngang","x",0,100)}{range("Vị trí dọc","y",0,100)}
 <label><input type="checkbox" checked={slot.logo} onChange={e=>change({logo:e.target.checked})}/> Hiện logo chữ</label><label><input type="checkbox" checked={slot.border} onChange={e=>change({border:e.target.checked})}/> Bo góc ảnh mẫu</label>
 <Button variant="outline" onClick={()=>change(initialSlots(prod,p.template)[index])}><RotateCcw/> Đặt lại khung</Button></aside></div>
 <div className="studio-panel"><h2>Lịch sử phiên bản</h2><ul className="history">{p.history.map((h,i)=><li key={i}>{h}</li>)}</ul></div>
 {modal==="preview"&&<Modal title={slotNames[index]} onClose={()=>setModal("")}><Composition slot={slot} product={prod} ratio={ratio} brand={db.brand.name}/></Modal>}
 {modal==="export"&&<Modal title="Xuất cấu hình demo" onClose={()=>setModal("")}><p>Tải cấu hình 9 khung, nội dung chữ và bố cục dưới dạng JSON để đối chiếu bản thiết kế.</p><Button onClick={()=>{downloadJson(p.id,{...p,slots,previewRatio:ratio});setModal("");}}>Tải tệp JSON</Button></Modal>}</>;
}
