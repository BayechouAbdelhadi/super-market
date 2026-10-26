"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, QrCode } from "lucide-react";
import { cn } from "cn";
import { logout } from "@/app/(site)/login/actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StoreCardQrDialog } from "@/components/loyalty/StoreCardQrDialog";
import { TIER_SURFACE } from "@/components/loyalty/tier-surface";
import type { LoyaltyTier } from "@/lib/loyalty/types";
import { CUSTOMER_HOME_LINK, CUSTOMER_MENU_LINKS } from "./customer-nav";

interface CustomerBottomNavProps {
  customerId: string;
  fullName: string;
  tier: LoyaltyTier;
}

const ITEM_CLASS = "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] leading-tight tracking-tight transition-colors";
/**
 * Mask of the bar surface: a 120px wide notch under the QR button (56px) with rounded shoulders,
 * flanked by solid fill. The SVG covers the top 40px of the middle, a plain fill covers the rest;
 * the fills overlap the SVG by 1px so no seam shows on fractional widths.
 */
const NOTCH_PATH = "M0 0H12C22 0 24 10 30 20C36 32 48 37 60 37C72 37 84 32 90 20C96 10 98 0 108 0H120V40H0Z";
const NOTCH_SVG = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><path d='${NOTCH_PATH}' fill='black' fill-rule='evenodd'/></svg>`)}")`;
const FILL = "linear-gradient(black, black)";
const NOTCH_MASK = {
  maskImage: `${NOTCH_SVG}, ${FILL}, ${FILL}, ${FILL}`,
  maskSize: "120px 40px, calc(50% - 59px) 100%, calc(50% - 59px) 100%, 120px calc(100% - 39px)",
  maskPosition: "center top, left top, right top, center bottom",
  maskRepeat: "no-repeat",
} as const;
/** Pill around a bar icon, filled with the tier color when the item is selected. */
const ICON_PILL_CLASS = "flex h-7 w-12 items-center justify-center rounded-full transition-colors";
const MENU_ITEM_CLASS = "flex min-h-[44px] w-full items-center gap-3 rounded-[var(--radius-button)] px-3 py-3 text-base font-medium transition-colors";

/**
 * Mobile bar of the customer space (below `md`): home, the store card QR code in the middle, and a quick access menu.
 * Last child of the shell column, so it stays at the bottom without `fixed`.
 */
export function CustomerBottomNav({ customerId, fullName, tier }: CustomerBottomNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === CUSTOMER_HOME_LINK.href;
  const isMenuActive = CUSTOMER_MENU_LINKS.some((link) => link.href === pathname);
  const HomeIcon = CUSTOMER_HOME_LINK.icon;
  const { barText, barTextActive, barSelected } = TIER_SURFACE[tier];
  const isMenuSelected = menuOpen || isMenuActive;

  return (
    <nav
      aria-label="Navigation mobile"
      className="relative z-40 flex h-16 shrink-0 items-stretch justify-around px-1 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Bar surface with a round notch cradling the QR button; drop-shadow draws the tier-colored top border along the curve. */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ filter: `drop-shadow(0 -1.5px 0 ${TIER_SURFACE[tier].barBorder}) drop-shadow(0 -4px 12px color-mix(in srgb, var(--color-text) 8%, transparent))` }}
      >
        <div className={cn("size-full bg-linear-to-br", TIER_SURFACE[tier].barGradient)} style={{ ...NOTCH_MASK, WebkitMaskImage: NOTCH_MASK.maskImage, WebkitMaskSize: NOTCH_MASK.maskSize, WebkitMaskPosition: NOTCH_MASK.maskPosition, WebkitMaskRepeat: NOTCH_MASK.maskRepeat }} />
      </div>

      <Link
        href={CUSTOMER_HOME_LINK.href}
        aria-current={isHome ? "page" : undefined}
        className={cn(ITEM_CLASS, "relative", isHome ? cn("font-semibold", barTextActive) : barText)}
      >
        <span className={cn(ICON_PILL_CLASS, isHome && barSelected)}>
          <HomeIcon aria-hidden className="size-5" />
        </span>
        {CUSTOMER_HOME_LINK.label}
      </Link>

      <div className="relative flex-1">
        <StoreCardQrDialog
          customerId={customerId}
          fullName={fullName}
          trigger={
            <button
              type="button"
              aria-label="Afficher ma carte du magasin"
              className="absolute top-0 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[var(--color-primary-text)] shadow-[var(--shadow-primary)] transition-transform active:scale-95"
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
              className={cn(ITEM_CLASS, "relative", isMenuSelected ? cn("font-semibold", barTextActive) : barText)}
            />
          }
        >
          <span className={cn(ICON_PILL_CLASS, isMenuSelected && barSelected)}>
            <Menu aria-hidden className="size-5" />
          </span>
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
