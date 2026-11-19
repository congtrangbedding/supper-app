"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { databaseSchema, type Database } from "./model";
import { initialDatabase } from "./fixtures";

const key="ecommerce-os:content-demo:v1";
let state:Database | null=null;
let warning="";
let hydrated=false;
const listeners=new Set<()=>void>();
function emit(){for(const notify of listeners)notify();}
function read(){
  try{
    const raw=localStorage.getItem(key);
    state=raw?databaseSchema.parse(JSON.parse(raw)):initialDatabase();
    warning="";
  }catch{state=initialDatabase();warning="Dữ liệu cục bộ không đọc được. Đã mở bộ mẫu để tiếp tục.";}
  hydrated=true;emit();
}
function subscribe(fn:()=>void){
  listeners.add(fn);
  if(listeners.size===1){read();window.addEventListener("storage",sync);}
  return ()=>{listeners.delete(fn);if(!listeners.size)window.removeEventListener("storage",sync);};
}
function sync(event:StorageEvent){if(event.key===key || event.key===null)read();}
export function updateDemo(change:(current:Database)=>Database){
  if(!state)read();
  const next=change(state!);
  try{localStorage.setItem(key,JSON.stringify(next));warning="";}catch{warning="Bộ nhớ trình duyệt đầy hoặc bị chặn. Thay đổi chỉ được giữ trong phiên này.";}
  state=next;emit();
}
const session=()=>state;
export function useDemo(){const db=useSyncExternalStore(subscribe,session,()=>null);return db!;}
export function DemoBoundary({children}:{children:ReactNode}){
  const db=useSyncExternalStore(subscribe,session,()=>null);
  if(!db || !hydrated)return <p role="status">Đang mở không gian mẫu…</p>;
  return <>{warning && <p role="alert" className="notice">{warning}</p>}{children}</>;
}
