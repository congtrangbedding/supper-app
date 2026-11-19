import { z } from "zod";

const str = z.string();
const strings = z.array(str);
export const categories = ["Chiếu mát", "Chiếu tre", "Chăn", "Bộ chăn ga", "Gối", "Thảm"];
export const slotNames = ["Ảnh bìa sản phẩm", "Chi tiết chất liệu", "Kích thước", "Không gian sống", "Họa tiết & màu sắc", "Đặc điểm sản phẩm", "Tình huống sử dụng", "Hướng dẫn bảo quản", "Tổng kết sản phẩm"];
export const sceneNames = ["Mở đầu", "Giới thiệu sản phẩm", "Cận cảnh chất liệu", "Lợi ích sản phẩm", "Kêu gọi hành động"];
const product = z.object({ id:str, name:str, sku:str, category:str, description:str, brand:str, material:str, color:str, pattern:str, dimensions:str, facts:str, colors:str, sizes:str, photos:strings, status:str });
export type Product = z.infer<typeof product>;
const slot = z.object({ headline:str, subtitle:str, facts:str, background:str, font:str, align:z.enum(["left","center","right"]), scale:z.number(), x:z.number(), y:z.number(), logo:z.boolean(), template:str, border:z.boolean() });
export type Slot = z.infer<typeof slot>;
const scene = z.object({ id:str, type:str, description:str, script:str, voice:str, duration:z.number().min(1), style:str, transition:str });
export type Scene = z.infer<typeof scene>;
const common = {id:str, name:str, productId:str, date:str, status:str, template:str};
const image = z.object({...common, ratios:strings, variant:str, slots:z.array(slot).length(9), history:strings});
const video = z.object({...common, ratio:str, style:str, avatar:str, voice:str, language:str, scenes:z.array(scene).min(1)});
export type ImageProject = z.infer<typeof image>;
export type VideoProject = z.infer<typeof video>;
const media = z.object({id:str,name:str,kind:z.enum(["Ảnh","Video","Âm thanh"]), source:str, cover:str, format:str, dimensions:str, bytes:z.number(), productId:str});
export type Asset = z.infer<typeof media>;
const job = z.object({id:str, type:str, productId:str, count:z.number(), template:str, start:z.number(), elapsed:z.number(), status:z.enum(["Đang chạy","Hoàn tất","Lỗi","Đã hủy"]), error:str});
export type Job = z.infer<typeof job>;
const approval = z.object({id:str,projectId:str,kind:z.enum(["image","video"]), name:str, productId:str,status:z.enum(["Chờ duyệt","Đã duyệt","Từ chối","Cần chỉnh sửa"]), notes:str});
export type Approval = z.infer<typeof approval>;
const template = z.object({id:str,name:str,kind:z.enum(["image","video"]),category:str,format:str,description:str,cover:str});
export type Template = z.infer<typeof template>;
export const databaseSchema = z.object({version:z.literal(1),products:z.array(product), images:z.array(image),videos:z.array(video),media:z.array(media),jobs:z.array(job),approvals:z.array(approval),templates:z.array(template),brand:z.object({name:str,primary:str,secondary:str,font:str}),ai:z.object({preset:str,imageStyle:str,videoStyle:str})});
export type Database = z.infer<typeof databaseSchema>;
export const uid = () => crypto.randomUUID();
export const coverOf = (p?:Product) => p?.photos[0] || "/studio-bedroom.jpg";
export function variants(p:Product) {
  const split = (value:string, fallback:string) => [...new Set(value.split(",").map(s=>s.trim()).filter(Boolean))].length ? [...new Set(value.split(",").map(s=>s.trim()).filter(Boolean))] : [fallback];
  return split(p.colors,p.color || "Chuẩn").flatMap((color,i)=>split(p.sizes,p.dimensions || "Chuẩn").map((size,j)=>({name:color+" · "+size,sku:p.sku+"-"+(i+1)+(j+1)})));
}
export function validateProduct(p:Product, others:Product[]) {
  if(!p.name.trim() || !p.sku.trim() || !categories.includes(p.category)) return "Điền tên, SKU và danh mục sản phẩm.";
  if(others.some(item=>item.id!==p.id && item.sku.toLowerCase()===p.sku.trim().toLowerCase())) return "SKU này đã được sử dụng.";
  return "";
}
export function filterProducts(products:Product[], query:string, category:string) {
  const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replaceAll("đ","d");
  return products.filter(p=>(!category || p.category===category) && norm(p.name+" "+p.sku).includes(norm(query.trim())));
}
export function initialSlots(p:Product, template:string):Slot[] {
  return slotNames.map((name,i)=>({headline:i===0?p.name:name,subtitle:i===1?p.material:p.brand,facts:p.facts,background:"#efece1",font:"Georgia",align:"left",scale:100,x:50,y:50,logo:true,template,border:true}));
}
export function initialScenes(p:Product, duration:number):Scene[] {
  return sceneNames.map((type,i)=>({id:"scene-"+i,type,description:type+" · "+p.name,script:[p.name,p.description,p.material,p.facts,"Khám phá "+p.brand][i],voice:"",duration:Math.floor(duration/5)+(i<duration%5?1:0),style:"Tự nhiên",transition:"Mờ dần"}));
}
export function moveItem<T>(items:T[],from:number,to:number) {
  if(to<0||to>=items.length||from<0||from>=items.length)return items;
  const result=[...items];result.splice(to,0,result.splice(from,1)[0]);return result;
}
export function batchOutputs(ids:string[],count:number){return ids.length*Math.max(0,Math.floor(count));}
export function jobProgress(job:Job,now:number){return job.status==="Hoàn tất"?100:Math.min(100,Math.floor((job.status==="Đang chạy"?Math.max(0,now-job.start):job.elapsed)/200));}
export function makeJob(productId:string,type:string,count:number,template:string):Job {
  return {id:uid(),productId,type,count,template,start:Date.now(),elapsed:0,status:"Đang chạy",error:""};
}
export function reviewProject(db:Database, record:Approval):Database {
  return {...db, approvals:[record,...db.approvals.filter(a=>a.projectId!==record.projectId || a.kind!==record.kind)],images:db.images.map(p=>record.kind==="image"&&p.id===record.projectId?{...p,status:record.status}:p),videos:db.videos.map(p=>record.kind==="video"&&p.id===record.projectId?{...p,status:record.status}:p)};
}
