"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { User } from "@/lib/loyalty/types";

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

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/loyalty" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-1 shadow-2xs">
            <Image src="/logo-icon.svg" alt="SuperMarket" width={32} height={32} priority className="h-full w-full object-contain" />
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
              Jalon 1 • Système d&apos;attribution &amp; déduction de points
            </p>
          </div>
        </Link>

        {/* Cashier Info & Live Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[var(--color-text)]">
              {cashier?.name || "Caissier en cours..."}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Poste Caisse #1 • {cashier?.role || "CASHIER"}
            </span>
          </div>

          <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-text)] font-semibold text-xs border border-[var(--color-border)]">
            MD
          </div>

          {time && (
            <div className="hidden md:block pl-3 border-l border-[var(--color-border)] text-xs font-mono text-[var(--color-text-muted)]">
              {time}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
