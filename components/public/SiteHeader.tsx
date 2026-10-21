import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogOut, Phone } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/(site)/login/actions";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import type { OpeningStatus } from "@/lib/store/opening-hours";
import { OpenStatus } from "@/components/public/home/OpenStatus";
import { SiteMobileMenu } from "./SiteMobileMenu";
import { SITE_NAV_LINKS, type AccountLink } from "./site-nav";
import { NavDot } from "./NavDot";

export type { AccountLink };

interface SiteHeaderProps {
  storeName: string;
  phone: string;
  status: OpeningStatus;
  /** Signed-in visitor's space; null shows the login button */
  account: AccountLink | null;
}

/**
 * Top bar of every public page, sticky inside the scroll container of app/(site)/layout.tsx (§ 25.4).
 * Below `lg` the section links move into a hamburger menu; on phones the account actions do too.
 */
export function SiteHeader({ storeName, phone, status, account }: SiteHeaderProps) {
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
          {SITE_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-11 items-center rounded-[var(--radius-button)] px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <span className="relative">
                {link.label}
                {link.dot && <NavDot className="absolute -top-1 -right-2.5" />}
              </span>
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {phone && !account && (
            <a href={phoneHref(phone)} className={cn(buttonVariants({ variant: "ghost" }), "hidden md:inline-flex")}>
              <Phone />
              <span>{formatPhone(phone)}</span>
            </a>
          )}
          {account ? (
            <>
              <Link href={account.href} className={cn(buttonVariants({ variant: "primary" }), "hidden sm:inline-flex")}>
                {account.label}
              </Link>
              <form action={logout} className="hidden sm:block">
                <button type="submit" aria-label="Se déconnecter" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                  <LogOut />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "primary" }), "hidden sm:inline-flex")}>
              <span>Mon compte</span>
              <ArrowRight className="hidden sm:block" />
            </Link>
          )}
          <SiteMobileMenu storeName={storeName} phone={phone} status={status} account={account} />
        </div>
      </div>
    </header>
  );
}
