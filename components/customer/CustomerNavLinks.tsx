"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { CUSTOMER_NAV_LINKS } from "./customer-nav";

/** Customer space links of the desktop header (CustomerBottomNav below `md`); the current page is highlighted. */
export function CustomerNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mon espace" className="hidden items-center gap-1 md:flex">
      {CUSTOMER_NAV_LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-[var(--radius-button)] px-3 text-sm font-medium transition-colors",
              isActive ? "bg-surface-hover text-text" : "text-text-muted hover:bg-surface-hover hover:text-text",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
