import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <ChevronRight size={13} className="shrink-0 text-[var(--subtle)]" /> : null}
              {item.href && !current ? (
                <Link href={item.href} className="truncate hover:text-[var(--foreground)]">{item.label}</Link>
              ) : (
                <span aria-current={current ? "page" : undefined} className={current ? "truncate text-[var(--foreground)]" : "truncate"}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}