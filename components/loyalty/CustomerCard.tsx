import React from "react";
import { CustomerSummary } from "@/lib/loyalty/types";
import { Card } from "@/components/ui/card";
import { ChevronRight, Mail, Phone } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { tierAvatarClasses } from "./tier-styles";

interface CustomerCardProps {
  customer: CustomerSummary;
  onSelect: (customer: CustomerSummary) => void;
}

export function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  return (
    <Card
      interactive
      padded="none"
      onClick={() => onSelect(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(customer);
        }
      }}
      className="group focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:outline-none overflow-hidden min-w-0"
    >
      {/* Header: status, tinted with the tier color */}
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b bg-gradient-to-r ${tierAvatarClasses(customer.tier)}`}>
        <StatusBadge status={customer.tier} size="sm" />
        <ChevronRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden />
      </div>

      <div className="px-3 py-2 space-y-1 min-w-0">
        <h3 className="text-base font-bold leading-snug text-[var(--color-text)] tracking-tight break-words group-hover:text-[var(--color-primary)] transition-colors">
          {customer.full_name}
        </h3>
        <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
          <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
          <span className="break-all">{customer.phone}</span>
        </p>
        <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
          <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
          <span className="break-all">{customer.email}</span>
        </p>
      </div>
    </Card>
  );
}
