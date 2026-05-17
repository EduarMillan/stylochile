import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Migas de pan"
      className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}
    >
      {items.map((item, idx) => {
        const last = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            {item.href && !last ? (
              <Link
                href={item.href}
                className="font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={`uppercase tracking-[0.15em] ${
                  last
                    ? "font-bold text-foreground/85"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            )}
            {!last && (
              <ChevronRight className="size-3 text-muted-foreground/60" />
            )}
          </span>
        );
      })}
    </nav>
  );
}
