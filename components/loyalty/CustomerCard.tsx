import React from "react";
import { CustomerSummary } from "@/lib/loyalty/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";

interface CustomerCardProps {
  customer: CustomerSummary;
  onSelect: (customer: CustomerSummary) => void;
}

export function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  return (
    <Card
      interactive
      padded="md"
      onClick={() => onSelect(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(customer);
        }
      }}
      className="group focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Customer identity & Contact info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
              {customer.full_name}
            </h3>
            <span className="text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform text-sm">
              →
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] font-mono">
            <span className="inline-flex items-center gap-1.5">
              <span>📱</span> {customer.phone}
            </span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1.5 font-sans">
              <span>✉️</span> {customer.email}
            </span>
          </div>
        </div>

        {/* Right: Status badge & Points metrics */}
        <div className="flex items-center gap-4 sm:justify-end">
          <StatusBadge status={customer.tier} size="md" />

          <div className="text-right border-l border-[var(--color-border)] pl-4">
            <div className="text-sm font-bold text-[var(--color-text)]">
              {customer.available_points.toLocaleString("fr-FR")} pts
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)]">
              {customer.historical_points.toLocaleString("fr-FR")} historiques
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
