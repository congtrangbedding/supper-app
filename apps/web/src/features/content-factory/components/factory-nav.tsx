"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { activeSlug, factoryHref, factoryNavGroups } from "../navigation";

export function FactoryNav({ onNavigate }: { onNavigate?: () => void }) {
  const active = activeSlug(usePathname());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // the sidebar and the mobile drawer both render this component, so ids must be per-instance
  const scope = useId();
  return (
    <div className="mt-1 mb-3 ml-3 border-l pl-2" aria-label="Điều hướng AI Content Factory" role="group">
      {factoryNavGroups.map(group => {
        const hasActive = group.items.some(item => item.slug === active);
        const open = hasActive || !collapsed[group.id];
        const panelId = scope + group.id;
        return (
          <div key={group.id} className="mt-2">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setCollapsed(state => ({ ...state, [group.id]: open }))}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase hover:bg-accent/60"
            >
              {group.label}
              <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} aria-hidden />
            </button>
            <ul id={panelId} hidden={!open} className="mt-0.5 space-y-px">
              {group.items.map(item => (
                <li key={item.slug}>
                  <Link
                    href={factoryHref(item.slug)}
                    onClick={onNavigate}
                    aria-current={item.slug === active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px] text-secondary-foreground hover:bg-accent",
                      item.slug === active && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.status === "soon" && <span className="shrink-0 rounded bg-secondary px-1.5 text-[10px] text-muted-foreground">Sắp có</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
