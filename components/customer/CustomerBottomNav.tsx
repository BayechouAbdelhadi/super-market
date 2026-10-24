"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, QrCode } from "lucide-react";
import { cn } from "cn";
import { logout } from "@/app/(site)/login/actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StoreCardQrDialog } from "@/components/loyalty/StoreCardQrDialog";
import { CUSTOMER_HOME_LINK, CUSTOMER_MENU_LINKS } from "./customer-nav";

interface CustomerBottomNavProps {
  customerId: string;
  fullName: string;
}

const ITEM_CLASS = "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] leading-tight tracking-tight transition-colors";
const MENU_ITEM_CLASS = "flex min-h-[44px] w-full items-center gap-3 rounded-[var(--radius-button)] px-3 py-3 text-base font-medium transition-colors";

/**
 * Mobile bar of the customer space (below `md`): home, the store card QR code in the middle, and a quick access menu.
 * Last child of the shell column, so it stays at the bottom without `fixed`.
 */
export function CustomerBottomNav({ customerId, fullName }: CustomerBottomNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === CUSTOMER_HOME_LINK.href;
  const isMenuActive = CUSTOMER_MENU_LINKS.some((link) => link.href === pathname);
  const HomeIcon = CUSTOMER_HOME_LINK.icon;

  return (
    <nav
      aria-label="Navigation mobile"
      className="z-40 flex h-16 shrink-0 items-stretch justify-around border-t border-border bg-surface px-1 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Link
        href={CUSTOMER_HOME_LINK.href}
        aria-current={isHome ? "page" : undefined}
        className={cn(ITEM_CLASS, isHome ? "font-semibold text-primary" : "text-text-muted hover:text-text")}
      >
        <HomeIcon aria-hidden className="size-5" />
        {CUSTOMER_HOME_LINK.label}
      </Link>

      <div className="flex flex-1 items-center justify-center">
        <StoreCardQrDialog
          customerId={customerId}
          fullName={fullName}
          trigger={
            <button
              type="button"
              aria-label="Afficher ma carte du magasin"
              className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-[var(--color-primary-text)] shadow-[var(--shadow-primary)] transition-transform active:scale-95"
            >
              <QrCode aria-hidden className="size-7" />
            </button>
          }
        />
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={cn(ITEM_CLASS, menuOpen || isMenuActive ? "font-semibold text-primary" : "text-text-muted hover:text-text")}
            />
          }
        >
          <Menu aria-hidden className="size-5" />
          Menu
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[var(--radius-dialog)] p-0">
          <SheetHeader className="px-5 pt-5 pb-2">
            <SheetTitle className="text-lg font-semibold tracking-tight text-text">Accès rapide</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 px-3 pb-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}>
            {CUSTOMER_MENU_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(MENU_ITEM_CLASS, isActive ? "bg-surface-hover text-text" : "text-text hover:bg-surface-hover")}
                >
                  <Icon aria-hidden className="size-5 text-text-muted" />
                  {link.label}
                </Link>
              );
            })}
            <form action={logout}>
              <button type="submit" className={cn(MENU_ITEM_CLASS, "text-danger-text hover:bg-danger-subtle")}>
                <LogOut aria-hidden className="size-5" />
                Se déconnecter
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
