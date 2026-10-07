"use client";

import { useState, useEffect, useTransition } from "react";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { logout } from "@/app/login/actions";
import { Menu, ChevronLeft, ExternalLink, LogOut, X } from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "CASHIER" | "CUSTOMER";
  email: string;
}

export function Sidebar({ role, email }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();

  const handleLogout = async () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  const isAdmin = role === "ADMIN";

  // Auto-close mobile drawer when navigating
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Navigation Links
  const navLinks = isAdmin
    ? [
        {
          name: "Caisse",
          href: "/cashier",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
        {
          name: "Gestion Clients",
          href: "/customers",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: "Gestion Caissiers",
          href: "/admin/cashiers",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          name: "Tableau de bord",
          href: "/admin",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
        },
      ]
    : [
        {
          name: "Caisse",
          href: "/cashier",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
        {
          name: "Gestion Clients",
          href: "/customers",
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ];

  const NavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link, idx) => {
          const isActive =
            pathname === link.href ||
            (link.href === "/customers" && pathname === "/admin/customers");
          return (
            <Link
              key={idx}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button,10px)] text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold shadow-2xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? link.name : ""}
            >
              {link.icon}
              {!isCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Secondary Links */}
      <div className="px-3 py-4 mt-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Liens utiles
          </div>
        )}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button,10px)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] text-sm font-medium transition-colors group ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Site web" : ""}
          target="_blank"
          onClick={onLinkClick}
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Voir le site public</span>}
        </Link>
      </div>
    </>
  );

  const UserFooter = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
      <div className="flex flex-col gap-3">
        {!collapsed ? (
          <>
            <div className="flex flex-col gap-0.5 px-1 overflow-hidden">
              <span
                className="text-sm font-semibold text-[var(--color-text)] truncate"
                title={email}
              >
                {email}
              </span>
              <div>
                <Badge variant={isAdmin ? "brand" : "neutral"} size="sm">
                  {isAdmin ? "Administrateur" : "Caisse"}
                </Badge>
              </div>
            </div>
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
                size="sm"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="w-full justify-center gap-2 cursor-pointer font-medium hover:text-[var(--color-danger)] hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
              </Button>
            </form>
          </>
        ) : (
          <form
            action={logout}
            className="flex justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <button
              type="submit"
              title="Déconnexion"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-danger)] hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Bar */}
      <div className="relative md:hidden flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 h-16 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" />
              }
            >
              <Menu className="w-6 h-6" />
            </SheetTrigger>

            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-72 max-w-[85vw] p-0 flex flex-col"
            >
              {/* Drawer Header */}
              <SheetHeader className="h-16 flex-row items-center justify-between px-4 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
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
                  <SheetTitle className="text-lg font-black text-[var(--color-text)] tracking-tight whitespace-nowrap">
                    SuperMarket
                  </SheetTitle>
                </div>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 min-h-[44px] min-w-[44px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      aria-label="Fermer le menu"
                    />
                  }
                >
                  <X className="w-5 h-5" />
                </SheetClose>
              </SheetHeader>

              {/* Nav Content */}
              <NavContent onLinkClick={() => setSheetOpen(false)} />

              {/* Footer */}
              <UserFooter />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
              <Image
                src="/logo.jpeg"
                alt="SuperMarket Logo"
                width={32}
                height={32}
                priority
                className="h-full w-full object-cover rounded-[calc(var(--radius-button,12px)-4px)]"
              />
            </div>
            <span className="text-base font-black text-[var(--color-text)] tracking-tight">
              SuperMarket
            </span>
          </div>
        </div>
        <Badge variant={isAdmin ? "brand" : "neutral"} size="sm">
          {isAdmin ? "Admin" : "Caisse"}
        </Badge>
      </div>

      {/* 2. Desktop Static Sidebar */}
      <aside
        className={`
          hidden md:flex md:static md:h-auto md:translate-x-0 md:flex-col md:shrink-0
          bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-300 ease-in-out relative
          ${isCollapsed ? "md:w-[72px]" : "md:w-64"}
        `}
      >
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-6 h-7 w-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:shadow-md transition-all shadow-sm z-50 cursor-pointer"
          title={isCollapsed ? "Développer" : "Réduire"}
          aria-label={isCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>

        {/* Desktop Header */}
        <div
          className={`h-16 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} border-b border-[var(--color-border)] shrink-0`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
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
            {!isCollapsed && (
              <span className="text-lg font-black text-[var(--color-text)] tracking-tight whitespace-nowrap">
                SuperMarket
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <NavContent />

        {/* Desktop Footer */}
        <UserFooter collapsed={isCollapsed} />
      </aside>
    </>
  );
}
