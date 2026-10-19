"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { logout } from "@/app/login/actions";
import {
  CreditCard,
  Users,
  UserCog,
  LayoutDashboard,
  Menu,
  ExternalLink,
  LogOut,
  X,
  Activity,
  Sliders,
  Sparkles,
} from "lucide-react";

interface MobileBottomNavProps {
  role: "ADMIN" | "CASHIER" | "CUSTOMER";
  email: string;
  storeName?: string;
}

export function MobileBottomNav({ role, email, storeName }: MobileBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();

  const isAdmin = role === "ADMIN";

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  const navItems = isAdmin
    ? [
        {
          name: "Accueil",
          href: "/admin",
          icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
        },
        {
          name: "Caisse",
          href: "/admin/pos",
          icon: <CreditCard className="w-5 h-5 shrink-0" />,
        },
        {
          name: "Clients",
          href: "/admin/customers",
          icon: <Users className="w-5 h-5 shrink-0" />,
        },
        {
          name: "Caissiers",
          href: "/admin/cashiers",
          icon: <UserCog className="w-5 h-5 shrink-0" />,
        },
      ]
    : [
        {
          name: "Accueil",
          href: "/cashier",
          icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
        },
        {
          name: "Caisse",
          href: "/cashier/pos",
          icon: <CreditCard className="w-5 h-5 shrink-0" />,
        },
        {
          name: "Clients",
          href: "/cashier/customers",
          icon: <Users className="w-5 h-5 shrink-0" />,
        },
      ];

  return (
    <nav
      aria-label="Navigation mobile principale"
      className="md:hidden shrink-0 h-16 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-stretch justify-around px-1 z-40 shadow-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/cashier" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors relative min-h-[44px] ${
              isActive
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isActive ? "bg-[var(--color-primary)]/10 scale-105" : ""
              }`}
            >
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Sheet trigger for "Menu" / User actions */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors min-h-[44px] cursor-pointer ${
                sheetOpen
                  ? "text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              aria-label="Ouvrir le menu et le profil"
            />
          }
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              sheetOpen ? "bg-[var(--color-primary)]/10 scale-105" : ""
            }`}
          >
            <Menu className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
            Menu
          </span>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[24px] max-h-[85vh] p-0 flex flex-col border-t border-[var(--color-border)] shadow-2xl"
        >
          {/* Visual Pull Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-hover)]" />
          </div>

          {/* Drawer Header */}
          <SheetHeader className="px-5 py-3 border-b border-[var(--color-border)] flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
                <Image
                  src="/logo.jpeg"
                  alt="SuperMarket Logo"
                  width={36}
                  height={36}
                  priority
                  className="h-full w-full object-cover rounded-[calc(var(--radius-button,12px)-4px)]"
                />
              </div>
              <SheetTitle className="text-base font-black text-[var(--color-text)] tracking-tight truncate max-w-[180px]">
                {storeName || "SuperMarket"}
              </SheetTitle>
            </div>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 min-h-[40px] min-w-[40px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                  aria-label="Fermer le menu"
                />
              }
            >
              <X className="w-5 h-5" />
            </SheetClose>
          </SheetHeader>

          {/* User Account Info */}
          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Connecté en tant que
                </span>
                <span className="text-sm font-bold text-[var(--color-text)] truncate" title={email}>
                  {email}
                </span>
              </div>
              <Badge variant={isAdmin ? "brand" : "neutral"} size="sm" className="shrink-0">
                {isAdmin ? "Administrateur" : "Caisse"}
              </Badge>
            </div>

            {/* Quick Links */}
            <div className="space-y-1">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Accès rapide
              </div>
              {isAdmin && (
                <Link
                  href="/admin/live"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-success-text" />
                    <span>Flux en direct</span>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-success-subtle text-success-text border border-success-border uppercase shadow-2xs">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                    </span>
                    <span>Live</span>
                  </span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/deals"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors min-h-[44px]"
                >
                  <Sparkles className="w-5 h-5 text-info-text" />
                  <span>Bons Plans &amp; Campagnes</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/settings"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors min-h-[44px]"
                >
                  <Sliders className="w-5 h-5 text-warning-text" />
                  <span>Configuration de l&apos;App</span>
                </Link>
              )}
              <Link
                href="/"
                target="_blank"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors min-h-[44px]"
              >
                <ExternalLink className="w-5 h-5 text-[var(--color-text-muted)]" />
                <span>Voir le site public</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-2">
              <form
                action={logout}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  loading={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full justify-center gap-2 font-semibold text-danger-text hover:bg-danger-subtle hover:border-danger-border border border-[var(--color-border)] min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {!isLoggingOut && <LogOut className="w-5 h-5 shrink-0" />}
                  <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
