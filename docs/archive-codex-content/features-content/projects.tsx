"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {Plus,ArrowRight,Check} from "lucide-react";
import {Button} from "@ecommerce-os/ui/components/button";
import {coverOf,initialScenes,initialSlots,uid,variants,type Template} from "./model";
import {useDemo,updateDemo} from "./repository";
import {Action,Empty,Field,Heading,Modal,Photo,Select,Tag} from "./ui";

export function Projects({video=false}:{video?:boolean}){
 const db=useDemo();const [q,setQ]=useState("");const [status,setStatus]=useState("Tất cả");const base="/content/"+(video?"videos":"images");
 const rows=(video?db.videos:db.images).filter(p=>p.name.toLocaleLowerCase().includes(q.toLocaleLowerCase())&&(status==="Tất cả"||status===p.status));
 return <><Heading title={video?"Dự án video":"Dự án ảnh"} description={video?"Quản lý phân cảnh và kịch bản phim sản phẩm.":"Quản lý bộ ảnh, bố cục và các bản nháp."} actions={<Action href={base+"/new"}><Plus/>{video?"Tạo video AI":"Tạo bộ ảnh"}</Action>}/><div className="filters"><Field label="Tìm dự án"><input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Tên dự án"/></Field><Select label="Trạng thái" value={status} onChange={setStatus} options={["Tất cả","Bản nháp","Chờ duyệt","Đã duyệt","Từ chối","Cần chỉnh sửa"]}/></div><div className="gallery">{rows.map(p=><Link key={p.id} className="preview-card" href={base+"/"+p.id+(video?"/storyboard":"/editor")}><Photo src={coverOf(db.products.find(x=>x.id===p.productId))}/><div><div className="line"><Tag>{p.status}</Tag><small>{p.date}</small></div><h3>{p.name}</h3><p>{"slots" in p?p.slots.length+" ảnh · "+p.ratios.join(" / "):p.scenes.reduce((n,s)=>n+s.duration,0)+" giây · "+p.ratio}</p><span className="text-link">{video?"Mở bảng phân cảnh":"Mở trình sửa ảnh"} <ArrowRight size={14}/></span></div></Link>)}</div>{!rows.length&&<Empty>Không có dự án phù hợp.</Empty>}</>;
}
export function Templates({video=false}:{video?:boolean}){
 const db=useDemo();const [preview,set]=useState<Template|null>(null);
 const href=(id:string)=>"/content/"+(video?"videos":"images")+"/new?template="+id;
 return <><Heading title={video?"Mẫu video":"Mẫu ảnh"} description="Xem trước phong cách và chọn mẫu cho dự án."/><div className="gallery">{db.templates.filter(t=>t.kind===(video?"video":"image")).map(t=><article className="preview-card" key={t.id}><Photo src={t.cover}/><div><Tag>{t.category}</Tag><h3>{t.name}</h3><p>{t.description}</p><small>{t.format}</small><div className="actions"><Button variant="outline" onClick={()=>set(t)}>Xem trước</Button><Action href={href(t.id)}>Chọn mẫu</Action></div></div></article>)}</div>{preview&&<Modal title={preview.name} onClose={()=>set(null)}><Photo src={preview.cover}/><p>{preview.description} · {preview.format}</p><Action href={href(preview.id)}>Dùng mẫu này</Action></Modal>}</>;
}
export function Wizard({video=false}:{video?:boolean}){
 const db=useDemo(),params=useSearchParams(),router=useRouter();
 const options=db.templates.filter(t=>t.kind===(video?"video":"image"));
 const [step,setStep]=useState(0),[productId,setProduct]=useState(db.products.find(p=>p.id===params.get("product"))?.id??db.products[0]?.id??""),[variant,setVariant]=useState(""),[ratio,setRatio]=useState(video?"9:16":"1:1"),[template,setTemplate]=useState(options.find(t=>t.id===params.get("template"))?.id??options[0].id),[style,setStyle]=useState("Tự nhiên"),[avatar,setAvatar]=useState("Chỉ sản phẩm"),[voice,setVoice]=useState("Giọng nữ"),[language,setLanguage]=useState("Tiếng Việt"),[duration,setDuration]=useState("20");
 const p=db.products.find(p=>p.id===productId);
 if(!p)return <Empty>Thêm sản phẩm trước khi tạo dự án. <Link href="/content/products/new">Tạo sản phẩm</Link></Empty>;
 const product=p;const steps=video?["Sản phẩm","Định dạng","Phong cách","Người dẫn","Giọng đọc","Thời lượng","Phân cảnh"]:["Sản phẩm","Biến thể","Tỷ lệ","Bộ mẫu","Xác nhận"];
 const ratios=ratio==="Cả hai"?["1:1","3:4"]:[ratio];const activeVariant=variant||variants(p)[0].name;
 const scenes=initialScenes(p,Number(duration));const templateName=options.find(t=>t.id===template)?.name;
 function finish(){
  const id=uid(),base={id,productId,name:product.name+(video?" · Phim ngắn":" · Bộ ảnh"),date:new Date().toISOString().slice(0,10),status:"Bản nháp",template};
  if(video)updateDemo(s=>({...s,videos:[{...base,ratio,style,avatar,voice,language,scenes:scenes.map(scene=>({...scene,style}))},...s.videos]}));
  else updateDemo(s=>({...s,images:[{...base,ratios,variant:activeVariant,slots:initialSlots(product,template),history:["Khởi tạo bộ ảnh"]},...s.images]}));
  router.push("/content/"+(video?"videos/":"images/")+id+(video?"/storyboard":"/editor"));
 }
 const review=step===steps.length-1;
 return <><Heading title={video?"Tạo video AI":"Tạo bộ ảnh"} description={"Bước "+(step+1)+" / "+steps.length+" · "+steps[step]}/><ol className="step-track">{steps.map((s,i)=><li key={s}><button disabled={i>step} aria-current={i===step?"step":undefined} onClick={()=>setStep(i)}>{i<step?<Check size={15}/>:i+1} {s}</button></li>)}</ol>
 <div className="wizard"><div className="studio-panel stack"><h2>{steps[step]}</h2>
 {step===0&&<div className="choice-grid">{db.products.map(item=><button className="choice" aria-pressed={productId===item.id} key={item.id} onClick={()=>{setProduct(item.id);setVariant("");}}><Photo src={coverOf(item)}/><strong>{item.name}</strong><small>{item.sku}</small></button>)}</div>}
 {!video&&step===1&&<Select label="Biến thể sản xuất" value={activeVariant} options={variants(p).map(v=>v.name)} onChange={setVariant}/>}
 {step===(video?1:2)&&<Select label="Tỷ lệ đầu ra" value={ratio} options={video?["9:16","16:9","1:1"]:["1:1","3:4","Cả hai"]} onChange={setRatio}/>}
 {step===(video?2:3)&&<>{video&&<Select label="Phong cách video" value={style} options={["Tự nhiên","Điện ảnh","Tối giản"]} onChange={setStyle}/>}<div className="choice-grid">{options.map(t=><button key={t.id} className="choice" aria-pressed={template===t.id} onClick={()=>setTemplate(t.id)}><Photo src={t.cover}/><strong>{t.name}</strong><small>{t.format}</small></button>)}</div></>}
 {video&&step===3&&<Select label="Phong cách người dẫn" value={avatar} options={["Chỉ sản phẩm","Người dẫn studio","Avatar minh họa"]} onChange={setAvatar}/>}
 {video&&step===4&&<><Select label="Giọng đọc" value={voice} options={["Giọng nữ","Giọng nam","Không lời"]} onChange={setVoice}/><Select label="Ngôn ngữ" value={language} options={["Tiếng Việt","English"]} onChange={setLanguage}/></>}
 {video&&step===5&&<Select label="Thời lượng (giây)" value={duration} options={["15","20","25","30"]} onChange={setDuration}/>}
 {review&&<><h3>{p.name}</h3><p>{templateName} · {ratios.join(" / ")}</p>{video?<><p>{style} · {avatar} · {voice} · {language}</p><ol className="summary-list">{scenes.map(s=><li key={s.id}>{s.type}<strong>{s.duration}s</strong></li>)}</ol></>:<p>{activeVariant} · 9 khung ảnh cho mỗi tỷ lệ.</p>}</>}
 <div className="actions">{step>0&&<Button variant="outline" onClick={()=>setStep(step-1)}>Quay lại</Button>}<Button onClick={()=>review?finish():setStep(step+1)}>{review?(video?"Tạo bảng phân cảnh":"Mở trình sửa ảnh"):"Tiếp tục"}<ArrowRight/></Button></div></div>
 <aside className="preview-card wizard-preview"><Photo src={coverOf(p)}/><div><Tag>{p.category}</Tag><h3>{p.name}</h3><p>{p.sku} · {templateName}</p></div></aside></div></>;
}
