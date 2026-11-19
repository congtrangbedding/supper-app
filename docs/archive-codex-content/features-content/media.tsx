"use client";
import {useState} from "react";
import {Button} from "@ecommerce-os/ui/components/button";
import {useDemo,updateDemo} from "./repository";
import {uid,type Asset} from "./model";
import {Empty,Field,Heading,Modal,Photo,Select,Tag,dataUrl} from "./ui";
export function Media(){
 const db=useDemo();const [kind,setKind]=useState<Asset["kind"]>("Ảnh"),[view,setView]=useState("Lưới"),[q,setQ]=useState(""),[format,setFormat]=useState("Tất cả"),[selection,setSelection]=useState<string[]>([]),[detail,setDetail]=useState(""),[confirm,setConfirm]=useState(false),[feedback,setFeedback]=useState(""),[productId,setProductId]=useState("");
 const rows=db.media.filter(a=>a.kind===kind && a.name.toLowerCase().includes(q.toLowerCase())&&(format==="Tất cả"||a.format===format)),asset=db.media.find(a=>a.id===detail);
 async function upload(file?:File){
  if(!file)return;setFeedback("Đang đọc tệp…");try{
   const type:Asset["kind"]|undefined=file.type.startsWith("image/")?"Ảnh":file.type.startsWith("video/")?"Video":file.type.startsWith("audio/")?"Âm thanh":undefined;
   if(!type || file.size>2500000)throw Error("Chọn ảnh, video hoặc âm thanh dưới 2,5 MB.");
   const source=await dataUrl(file);let dimensions="—";
   if(type==="Ảnh"){const im=new Image();im.src=source;await im.decode();dimensions=im.naturalWidth+" × "+im.naturalHeight;}
   const a:Asset={id:uid(),kind:type,name:file.name,format:file.type.split("/")[1].toUpperCase(),source,cover:type==="Ảnh"?source:"",dimensions,bytes:file.size,productId};
   updateDemo(s=>({...s,media:[a,...s.media]}));setKind(type);setFormat("Tất cả");setQ("");setFeedback("Đã thêm tệp vào thư viện demo.");
  }catch(e){setFeedback((e as Error).message);}
 }
 function thumbnail(a:Asset){if(a.cover)return <Photo src={a.cover} alt={a.name}/>;return <span className="media-symbol">{a.kind==="Video"?"▶":"♫"}</span>;}
 return <><Heading title="Thư viện media" description="Tổ chức ảnh, video và âm thanh của studio."/><div className="studio-panel filters"><Field label="Gắn tệp mới với sản phẩm"><select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">Chưa liên kết</option>{db.products.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Thêm tệp cục bộ"><input type="file" accept="image/*,video/*,audio/*" onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/></Field></div><p role="status" className="feedback">{feedback}</p>
 <div className="line"><div className="tabs">{(["Ảnh","Video","Âm thanh"] as const).map(k=><button key={k} aria-pressed={kind===k} onClick={()=>{setKind(k);setFormat("Tất cả");}}>{k}</button>)}</div><div className="tabs">{["Lưới","Danh sách"].map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v}</button>)}</div></div>
 <div className="filters"><Field label="Tìm tư liệu"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tên tệp"/></Field><Select label="Định dạng" value={format} options={["Tất cả",...new Set(db.media.filter(a=>a.kind===kind).map(a=>a.format))]} onChange={setFormat}/>{selection.length>0&&<Button variant="outline" onClick={()=>setConfirm(true)}>Xóa {selection.length} tệp</Button>}</div>
 <div className={view==="Lưới"?"gallery":"media-list"}>{rows.map(a=><article className="preview-card" key={a.id}><button onClick={()=>setDetail(a.id)} aria-label={"Xem "+a.name}>{thumbnail(a)}</button><div><label><input type="checkbox" checked={selection.includes(a.id)} onChange={()=>setSelection(selection.includes(a.id)?selection.filter(v=>v!==a.id):[...selection,a.id])}/> Chọn</label><h3><button onClick={()=>setDetail(a.id)}>{a.name}</button></h3><small>{a.format} · {a.dimensions}</small></div></article>)}</div>{!rows.length&&<Empty>Chưa có tệp phù hợp. Chọn một tệp cục bộ để thêm vào thư viện.</Empty>}
 {asset&&<Modal title={asset.name} onClose={()=>setDetail("")}>{asset.kind==="Ảnh"?<Photo src={asset.source}/>:asset.kind==="Video"?<video controls src={asset.source}/>:<audio controls src={asset.source}/>}<Tag>{asset.format}</Tag><p>{asset.dimensions} · {Math.ceil(asset.bytes/1024)} KB</p><p>{db.products.find(p=>p.id===asset.productId)?.name||"Chưa liên kết sản phẩm"}</p></Modal>}
 {confirm&&<Modal title="Xóa tư liệu đã chọn?" onClose={()=>setConfirm(false)}><p>{selection.length} tệp sẽ được gỡ khỏi thư viện demo.</p><div className="actions"><Button variant="outline" onClick={()=>setConfirm(false)}>Giữ lại</Button><Button onClick={()=>{updateDemo(s=>({...s,media:s.media.filter(a=>!selection.includes(a.id))}));setConfirm(false);setSelection([]);}}>Xác nhận xóa</Button></div></Modal>}</>;
}
