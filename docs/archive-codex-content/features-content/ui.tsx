"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useId,type ReactNode} from "react";
import { X, ArrowUpRight, FolderOpen } from "lucide-react";
import {Button} from "@ecommerce-os/ui/components/button";
export function Action({href,children,secondary=false}:{href:string;children:ReactNode;secondary?:boolean}){
  return <Button variant={secondary?"outline":"default"} asChild><Link href={href}>{children}</Link></Button>;
}
export function Heading({title,description,actions}:{title:string;description?:string;actions?:ReactNode}){
  return <div className="studio-heading"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div><div className="actions">{actions}</div></div>;
}
export function Photo({src,alt="",className=""}:{src:string;alt?:string;className?:string}){
  return <Image unoptimized width={512} height={512} src={src||"/studio-bedroom.jpg"} alt={alt} className={"studio-photo "+className}/>;
}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="studio-field"><span>{label}</span>{children}</label>;}
export function Select({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(v:string)=>void}){
  return <Field label={label}><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(v=><option key={v}>{v}</option>)}</select></Field>;
}
export function Empty({children}:{children:ReactNode}){return <div className="studio-empty"><FolderOpen size={26}/><p>{children}</p></div>;}
export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null);const id=useId();
  useEffect(()=>{const d=ref.current;d?.showModal();return()=>d?.close();},[]);
  return <dialog className="studio-dialog studio" ref={ref} aria-labelledby={id} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div><div className="line"><h2 id={id}>{title}</h2><button onClick={onClose} aria-label="Đóng"><X size={18}/></button></div>{children}</div></dialog>;
}
export function Tag({children}:{children:ReactNode}){return <span className="studio-tag">{children}</span>;}
export function SectionTitle({title,href}:{title:string;href?:string}){return <div className="line"><h2>{title}</h2>{href&&<Link className="text-link" href={href}>Xem tất cả <ArrowUpRight size={15}/></Link>}</div>;}
export function dataUrl(file:File):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Không đọc được tệp."));reader.readAsDataURL(file);});}
export function downloadJson(name:string,value:unknown){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=name+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
