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
      label: "BRONZE",
      icon: "🥉",
      classes:
        "bg-amber-50 text-[var(--color-tier-bronze)] border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/50",
    },
    silver: {
      label: "SILVER",
      icon: "🥈",
      classes:
        "bg-slate-100 text-[var(--color-tier-silver)] border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    },
    gold: {
      label: "GOLD",
      icon: "🥇",
      classes:
        "bg-amber-100/70 text-amber-900 border-amber-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
    },
    vip: {
      label: "VIP",
      icon: "👑",
      classes:
        "bg-purple-50 text-[var(--color-tier-vip)] border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
    },
  }[normalized] || {
    label: status.toUpperCase(),
    icon: "⭐",
    classes: "bg-zinc-100 text-[var(--color-text)] border-[var(--color-border)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wider uppercase font-sans select-none ${config.classes} ${sizeClasses}`}
    >
      <span className="text-[1.1em]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

// Re-export TierBadge for compatibility
export const TierBadge = StatusBadge;
