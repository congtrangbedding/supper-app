import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "../navigation";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn trang" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((crumb, index) => {
          const last = index === items.length - 1;
          return (
            <li key={crumb.label + index} className="flex items-center gap-1">
              {crumb.href && !last ? (
                <Link href={crumb.href} className="rounded hover:text-foreground hover:underline">{crumb.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "font-medium text-foreground" : undefined}>{crumb.label}</span>
              )}
              {!last && <ChevronRight className="size-3" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  meta
}: {
  title: string;
  description?: string;
  crumbs: Crumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl! tracking-tight! sm:text-3xl!">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function DemoBadge({ children = "DEMO" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-warning">
      {children}
    </span>
  );
}
