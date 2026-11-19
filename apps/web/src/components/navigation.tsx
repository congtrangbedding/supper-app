"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers3, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { Separator } from "@ecommerce-os/ui/components/separator";
import { applications, factoryPages } from "@/lib/workspace";
import { applicationIcons } from "@/lib/icons";

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  function item(href: string, title: string, icon?: React.ReactNode, suffix?: React.ReactNode) {
    return <Link key={href} href={href} onClick={onNavigate} aria-current={path === href ? "page" : undefined} className="nav-link">{icon}{title}{suffix}</Link>;
  }
  return <nav aria-label="Điều hướng chính">
    <Link href="/" onClick={onNavigate} className="brand"><span><Layers3 size={22}/></span>Ecommerce OS</Link>
    <div className="nav-group"><small>Không gian làm việc</small>
    {item("/", "Tổng quan", <LayoutDashboard/>)}</div>
    <div className="nav-group"><small>Ứng dụng</small>
    {applications.map(app => {
      const Icon = applicationIcons[app.slug];
      const factory = app.slug === "content-factory";
      return <div key={app.slug}>{item("/"+app.slug, app.title, <Icon/>, factory && <ChevronDown className="tail"/>)}
        {factory && <div className="subnav">{factoryPages.map(page => item("/content-factory/"+page.slug, page.title))}</div>}</div>;
    })}</div>
    <div className="nav-bottom"><Separator/>{item("/settings", "Cài đặt", <Settings/>)}</div>
  </nav>;
}
