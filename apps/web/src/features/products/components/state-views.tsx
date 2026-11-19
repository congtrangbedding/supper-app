import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@ecommerce-os/ui/components/button";

export function LoadingView({ label = "Đang tải dữ liệu demo…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm">
      <p className="flex items-center gap-2 font-medium text-destructive"><TriangleAlert className="size-4" aria-hidden /> Không tải được dữ liệu</p>
      <p className="text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
    </div>
  );
}

export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">{children}</p>;
}
