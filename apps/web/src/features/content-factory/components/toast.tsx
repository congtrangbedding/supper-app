"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@ecommerce-os/ui/lib/utils";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}
interface ToastApi {
  toast: (input: { title: string; description?: string; tone?: Tone }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}

const icons = { success: CheckCircle2, error: TriangleAlert, info: Info } as const;

function ToastView({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(item.id), item.tone === "error" ? 8000 : 5000);
    return () => window.clearTimeout(timer);
  }, [item, onClose]);
  const Icon = icons[item.tone];
  return (
    <li className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 text-sm shadow-lg">
      <Icon className={cn("mt-0.5 size-4 shrink-0", item.tone === "success" && "text-success", item.tone === "error" && "text-destructive", item.tone === "info" && "text-muted-foreground")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        {item.description && <p className="text-muted-foreground">{item.description}</p>}
      </div>
      <button type="button" aria-label="Đóng thông báo" onClick={() => onClose(item.id)} className="rounded p-0.5 text-muted-foreground hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
        <X className="size-4" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const close = useCallback((id: number) => setItems(list => list.filter(t => t.id !== id)), []);
  const api = useMemo<ToastApi>(
    () => ({ toast: ({ title, description, tone = "success" }) => setItems(list => [...list.slice(-3), { id: Date.now() + Math.random(), title, description, tone }]) }),
    []
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ul role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] ml-auto flex max-w-sm flex-col gap-2">
        {items.map(item => <ToastView key={item.id} item={item} onClose={close} />)}
      </ul>
    </ToastContext.Provider>
  );
}
