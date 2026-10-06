"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { User } from "@/lib/loyalty/types";
import { logout } from "@/app/login/actions";

interface CashierHeaderProps {
  cashier: User | null;
}

export function CashierHeader({ cashier }: CashierHeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = cashier?.role === "ADMIN";
  const fullName = cashier
    ? `${cashier.first_name || ""} ${cashier.last_name || ""}`.trim() || cashier.email
    : "Opérateur en cours...";
  const initials = cashier
    ? `${cashier.first_name?.[0] || ""}${cashier.last_name?.[0] || ""}`.toUpperCase() || (isAdmin ? "AD" : "CA")
    : "OP";

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md shrink-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/cashier" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-1 shadow-2xs overflow-hidden">
              <Image src="/logo.jpeg" alt="SuperMarket" width={32} height={32} priority className="h-full w-full object-cover rounded-[calc(var(--radius-button,12px)-4px)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[var(--color-text)]">
                  SuperMarket
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  Fidélité Caisse
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
                Système d&apos;attribution &amp; déduction de points • 1 € = 1 pt
              </p>
            </div>
          </Link>

          {/* Quick link back to admin if current operator is an Admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors shadow-2xs"
            >
              <span>←</span>
              <span>Tableau de bord Admin</span>
            </Link>
          )}
        </div>

        {/* Cashier Info, Clock & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[var(--color-text)]">
              {fullName}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {isAdmin ? "Mode Administrateur" : "Poste Caisse #1"} • {cashier?.role || "CASHIER"}
            </span>
          </div>

          <div 
            className="h-8 w-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs border border-[var(--color-primary)]/20 shadow-2xs"
            title={fullName}
          >
            {initials}
          </div>

          {time && (
            <div className="hidden md:block pl-3 border-l border-[var(--color-border)] text-xs font-mono text-[var(--color-text-muted)]">
              {time}
            </div>
          )}

          {/* Logout Action */}
          <form action={logout}>
            <button
              type="submit"
              title="Déconnexion"
              className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-rose-50 hover:text-[var(--color-danger)] hover:border-rose-200 text-[var(--color-text-muted)] transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden lg:inline font-medium">Déconnexion</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
