import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import type { OpeningStatus } from "@/lib/store/opening-hours";
import { OpenStatus } from "./OpenStatus";

const NAV_LINKS = [
  { href: "#rayons", label: "Nos rayons" },
  { href: "#infos", label: "Infos pratiques" },
  { href: "#fidelite", label: "Fidélité" },
];

interface SiteHeaderProps {
  storeName: string;
  phone: string;
  status: OpeningStatus;
}

/** Home page top bar, sticky inside the scroll container of app/(site)/layout.tsx (§ 25.4). */
export function SiteHeader({ storeName, phone, status }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:h-18">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-[var(--radius-button)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface p-0.5">
            <Image src="/logo-hq.png" alt="" width={40} height={40} priority className="h-full w-full object-contain" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-text">{storeName}</span>
          <OpenStatus initial={status} variant="compact" className="hidden sm:inline-flex py-0.5 text-xs" />
        </Link>

        <nav aria-label="Sections" className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-11 items-center rounded-[var(--radius-button)] px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {phone && (
            <a href={phoneHref(phone)} className={cn(buttonVariants({ variant: "ghost" }), "hidden md:inline-flex")}>
              <Phone />
              <span>{formatPhone(phone)}</span>
            </a>
          )}
          <Link href="/login" className={buttonVariants({ variant: "primary" })}>
            <span>Mon compte</span>
            <ArrowRight className="hidden sm:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}
