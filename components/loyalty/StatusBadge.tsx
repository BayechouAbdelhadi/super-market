import React from "react";
import { LoyaltyTier } from "@/lib/loyalty/types";

export interface StatusBadgeProps {
  status: "bronze" | "silver" | "gold" | "vip" | LoyaltyTier;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as "bronze" | "silver" | "gold" | "vip";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-semibold",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-bold",
  }[size];

  const config = {
    bronze: {
      label: "Bronze",
      icon: "🥉",
      classes:
        "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/20 shadow-[0_1px_2px_rgba(217,119,6,0.06)]",
    },
    silver: {
      label: "Silver",
      icon: "🥈",
      classes:
        "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/25 shadow-[0_1px_2px_rgba(100,116,139,0.06)]",
    },
    gold: {
      label: "Gold",
      icon: "🥇",
      classes:
        "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/35 shadow-[0_1px_3px_rgba(245,158,11,0.12)] font-bold",
    },
    vip: {
      label: "VIP Privilège",
      icon: "👑",
      classes:
        "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-950 dark:border-zinc-200 shadow-[0_2px_6px_rgba(0,0,0,0.15)] font-bold",
    },
  }[normalized] || {
    label: status.toUpperCase(),
    icon: "⭐",
    classes: "bg-[var(--color-surface-hover)] text-[var(--color-text)] border-[var(--color-border)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide font-sans select-none transition-all ${config.classes} ${sizeClasses}`}
    >
      <span className="text-[1.1em] shrink-0 leading-none">{config.icon}</span>
      <span className="leading-none">{config.label}</span>
    </span>
  );
}

// Re-export TierBadge for compatibility
export const TierBadge = StatusBadge;
