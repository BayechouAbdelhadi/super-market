"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import { ChevronLeft, ExternalLink, LogOut, Loader2, Activity } from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "CASHIER" | "CUSTOMER";
  email: string;
}

export function Sidebar({ role, email }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();

  const handleLogout = async () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  const isAdmin = role === "ADMIN";



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
        {
          name: "Flux en direct",
          href: "/admin/live",
          isLive: true,
          icon: <Activity className="w-5 h-5 shrink-0" />,
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
          const isLive = Boolean((link as any).isLive);
          return (
            <Link
              key={idx}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button,10px)] text-sm font-medium transition-colors group relative ${
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold shadow-2xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? link.name : ""}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                {link.icon}
                {isLive && isCollapsed && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="whitespace-nowrap flex-1">{link.name}</span>
                  {isLive && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase shadow-2xs">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span>Live</span>
                    </span>
                  )}
                </>
              )}
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
                loading={isLoggingOut}
                onClick={handleLogout}
                className="w-full justify-center gap-2 cursor-pointer font-medium hover:text-[var(--color-danger)] hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
              >
                {!isLoggingOut && <LogOut className="w-4 h-4 shrink-0" />}
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
              className="p-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-danger)] hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
              aria-label="Déconnexion"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Bar */}
      <header className="relative md:hidden flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 h-14 shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
            <Image
              src="/logo-hq.png"
              alt="SuperMarket Logo"
              width={36}
              height={36}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-base font-black text-[var(--color-text)] tracking-tight">
            SuperMarket
          </span>
        </div>

        <Badge variant={isAdmin ? "brand" : "neutral"} size="sm">
          {isAdmin ? "Admin" : "Caisse"}
        </Badge>
      </header>

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
            <div className="h-10 w-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
              <Image
                src="/logo-hq.png"
                alt="SuperMarket Logo"
                width={40}
                height={40}
                priority
                className="h-full w-full object-contain"
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
