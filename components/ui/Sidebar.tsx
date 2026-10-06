"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  role: "ADMIN" | "CASHIER" | "CUSTOMER";
  email: string;
}

export function Sidebar({ role, email }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isAdmin = role === "ADMIN";

  // Navigation Links
  // L'admin a accès à toutes les sections y compris l'espace caisse.
  // Le caissier a UNIQUEMENT accès à l'espace caisse.
  const navLinks = isAdmin ? [
    {
      name: "Tableau de bord",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      name: "Espace Caisse",
      href: "/cashier",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: "Gestion Caissiers",
      href: "/admin/cashiers",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: "Gestion Clients",
      href: "/admin/customers",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ] : [
    {
      name: "Espace Caisse",
      href: "/cashier",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 h-16 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-black text-[var(--color-text)] tracking-tight">SuperMarket</h1>
        </div>
        <Badge variant={isAdmin ? "brand" : "neutral"} size="sm">
          {isAdmin ? "Admin" : "Caisse"}
        </Badge>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          md:static md:h-auto md:translate-x-0 md:flex md:shrink-0
          fixed top-0 bottom-0 left-0 z-50 h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 ease-in-out shrink-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "md:w-[72px]" : "w-64"}
        `}
      >
        {/* Desktop Collapse Toggle (Floating on border) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-6 h-7 w-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:shadow-md transition-all shadow-sm z-50 cursor-pointer"
          title={isCollapsed ? "Développer" : "Réduire"}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Header / Logo */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-[var(--color-border)] shrink-0`}>
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

          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={idx}
                href={link.href} 
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button,10px)] text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? link.name : ""}
              >
                {link.icon}
                {!isCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Links / Shortcuts */}
        <div className="px-3 py-4 mt-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Liens utiles
            </div>
          )}
          <Link 
            href="/" 
            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button,10px)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] text-sm font-medium transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Site web" : ""}
            target="_blank"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap">Voir le site public</span>}
          </Link>
        </div>

        {/* Footer / User Info */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <div className="flex flex-col gap-3">
            {!isCollapsed ? (
              <>
                <div className="flex flex-col gap-0.5 px-1 overflow-hidden">
                  <span className="text-sm font-semibold text-[var(--color-text)] truncate" title={email}>
                    {email}
                  </span>
                  <div>
                    <Badge variant={isAdmin ? "brand" : "neutral"} size="sm">
                      {isAdmin ? "Administrateur" : "Caisse"}
                    </Badge>
                  </div>
                </div>
                <form action={logout}>
                  <Button variant="secondary" size="sm" className="w-full justify-center">
                    Déconnexion
                  </Button>
                </form>
              </>
            ) : (
              <form action={logout} className="flex justify-center">
                <button type="submit" title="Déconnexion" className="p-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-danger)] hover:bg-red-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
