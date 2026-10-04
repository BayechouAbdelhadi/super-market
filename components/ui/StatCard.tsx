import React from "react";
import { Card } from "./Card";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: string;
  accent?: "default" | "brand" | "neutral";
}

export function StatCard({
  label,
  value,
  unit,
  description,
  icon,
  accent = "default",
}: StatCardProps) {
  const accentClasses = {
    brand:
      "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20 text-[var(--color-text)]",
    default:
      "bg-[var(--color-surface)] border-[var(--color-border)]",
    neutral:
      "bg-[var(--color-surface-hover)] border-[var(--color-border)]",
  }[accent];

  return (
    <Card className={`space-y-2 ${accentClasses}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-[var(--color-text-muted)]">
            {unit}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          {description}
        </p>
      )}
    </Card>
  );
}
