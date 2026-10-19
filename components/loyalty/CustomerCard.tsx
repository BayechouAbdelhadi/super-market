import React from "react";
import { CustomerSummary } from "@/lib/loyalty/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";

interface CustomerCardProps {
  customer: CustomerSummary;
  onSelect: (customer: CustomerSummary) => void;
}

export function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  const initials = customer.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CL";

  const tierGradients: Record<string, string> = {
    bronze: "from-tier-bronze/20 to-tier-bronze/10 text-tier-bronze-text border-tier-bronze/40",
    silver: "from-tier-silver/20 to-tier-silver/10 text-tier-silver-text border-tier-silver/40",
    gold: "from-tier-gold/30 to-tier-gold/15 text-tier-gold-text border-tier-gold",
    vip: "from-tier-vip to-tier-vip/85 text-background border-tier-vip",
  };

  const avatarStyle =
    tierGradients[(customer.tier || "").toLowerCase()] ||
    "from-[var(--color-surface-hover)] to-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]";

  return (
    <Card
      interactive
      padded="sm"
      onClick={() => onSelect(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(customer);
        }
      }}
      className="group focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:outline-none p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarStyle} border flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.04)]`}
          >
            {initials}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight truncate group-hover:text-[var(--color-primary)] transition-colors">
                {customer.full_name}
              </h3>
            </div>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-muted)] font-mono">
              <span className="inline-flex items-center gap-1.5">
                <span>📱</span> {customer.phone}
              </span>
              <span className="opacity-30">•</span>
              <span className="inline-flex items-center gap-1.5 font-sans truncate">
                <span>✉️</span> {customer.email}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status badge & Points metrics */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0">
          <StatusBadge status={customer.tier} size="md" />

          <div className="text-right sm:border-l border-[var(--color-border)] sm:pl-4">
            <div className="text-base sm:text-lg font-extrabold text-[var(--color-text)] tracking-tight">
              {customer.available_points.toLocaleString("fr-FR")} <span className="text-xs font-semibold text-[var(--color-primary)]">pts</span>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
              {customer.historical_points.toLocaleString("fr-FR")} cumulés
            </div>
          </div>

          <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/40 group-hover:translate-x-0.5 transition-all text-sm shrink-0">
            →
          </div>
        </div>
      </div>
    </Card>
  );
}
