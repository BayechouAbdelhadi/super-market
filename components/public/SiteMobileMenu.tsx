"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, LogOut, Menu, Navigation, Phone, X } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/app/(site)/login/actions";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { STORE_LOCATION } from "@/lib/store/config";
import type { OpeningStatus } from "@/lib/store/opening-hours";
import { OpenStatus } from "@/components/public/home/OpenStatus";
import { SITE_NAV_HAS_DOT, SITE_NAV_LINKS, type AccountLink } from "./site-nav";
import { NavDot } from "./NavDot";

interface SiteMobileMenuProps {
  storeName: string;
  phone: string;
  status: OpeningStatus;
  account: AccountLink | null;
}

/**
 * Hamburger menu of the site header below the `lg` breakpoint: sections, store contact and account actions
 * in a right-hand drawer. Focus trap, Escape and outside click come from the Sheet (Base UI Dialog).
 */
export function SiteMobileMenu({ storeName, phone, status, account }: SiteMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Ouvrir le menu"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative lg:hidden text-text")}
      >
        <Menu className="size-6" />
        {SITE_NAV_HAS_DOT && <NavDot className="absolute top-2 right-2" />}
      </SheetTrigger>

      <SheetContent side="right" showCloseButton={false} className="gap-0">
        {/* Head */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface p-0.5">
              <Image src="/logo-hq.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <SheetTitle className="truncate text-base font-semibold">{storeName}</SheetTitle>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer le menu"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="px-4 pt-5">
            <OpenStatus initial={status} />
          </div>

          {/* Sections */}
          <nav aria-label="Menu principal" className="px-2 py-4">
            <ul>
              {SITE_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="flex min-h-12 items-center justify-between rounded-[var(--radius-button)] px-3 text-lg font-medium text-text transition-colors hover:bg-surface-hover"
                  >
                    <span className="relative">
                      {link.label}
                      {link.dot && <NavDot className="absolute -top-0.5 -right-3" />}
                    </span>
                    <ChevronRight aria-hidden className="h-5 w-5 text-text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Store contact */}
          <div className="mx-4 space-y-1 border-t border-border py-4">
            <a
              href={STORE_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="-mx-2 flex min-h-12 items-center gap-3 rounded-[var(--radius-button)] px-2 text-base font-medium text-text transition-colors hover:bg-surface-hover"
            >
              <Navigation aria-hidden className="h-5 w-5 text-text-muted" />
              Itinéraire
            </a>
            {phone && (
              <a
                href={phoneHref(phone)}
                className="-mx-2 flex min-h-12 items-center gap-3 rounded-[var(--radius-button)] px-2 text-base font-medium text-text transition-colors hover:bg-surface-hover"
              >
                <Phone aria-hidden className="h-5 w-5 text-text-muted" />
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>

        {/* Account */}
        <div className="shrink-0 space-y-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {account ? (
            <>
              <Link href={account.href} onClick={close} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
                {account.label}
              </Link>
              <form action={logout}>
                <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}>
                  <LogOut />
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
                Se connecter
              </Link>
              <Link href="/signup" onClick={close} className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}>
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
