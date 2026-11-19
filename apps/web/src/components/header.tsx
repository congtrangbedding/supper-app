"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, UserRound, PanelsTopLeft } from "lucide-react";
import { getDestination } from "@/lib/workspace";
import { Navigation } from "./navigation";

export function Header() {
  const dialog = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  return <header className="topbar">
    <button className="mobile-menu" aria-label="Mở điều hướng" onClick={() => dialog.current?.showModal()}><Menu/></button>
    <span className="crumb"><PanelsTopLeft size={17}/> Ecommerce OS <ChevronRight size={14}/></span>
    <strong>{path === "/" ? "Tổng quan" : getDestination(path.slice(1))?.title ?? "Trang không tồn tại"}</strong>
    <span className="user"><UserRound size={16}/> <span>Người dùng nội bộ</span></span>
    <dialog ref={dialog} className="drawer" onClick={event => { if(event.target === dialog.current) dialog.current.close(); }} aria-label="Menu điều hướng">
      <button className="drawer-close" aria-label="Đóng điều hướng" onClick={() => dialog.current?.close()}><X size={18}/></button>
      <Navigation onNavigate={() => dialog.current?.close()}/>
    </dialog>
  </header>;
}
