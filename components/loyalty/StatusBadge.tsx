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
        "bg-tier-bronze/10 text-tier-bronze-text border-tier-bronze/25 shadow-[var(--shadow-subtle)]",
    },
    silver: {
      label: "Silver",
      icon: "🥈",
      classes:
        "bg-tier-silver/10 text-tier-silver-text border-tier-silver/25 shadow-[var(--shadow-subtle)]",
    },
    gold: {
      label: "Gold",
      icon: "🥇",
      classes:
        "bg-tier-gold/15 text-tier-gold-text border-tier-gold/35 shadow-[var(--shadow-subtle)] font-bold",
    },
    vip: {
      label: "VIP Privilège",
      icon: "👑",
      classes:
        "bg-tier-vip text-background border-tier-vip shadow-[var(--shadow-card)] font-bold",
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
