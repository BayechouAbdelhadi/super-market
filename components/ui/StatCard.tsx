import React from "react";
import { Card } from "./card";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: string;
  accent?: "default" | "brand" | "neutral";
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

export function StatCard({
  label,
  value,
  unit,
  description,
  icon,
  accent = "default",
  trend,
  trendDirection = "neutral",
}: StatCardProps) {
  const accentClasses = {
    brand:
      "bg-gradient-to-br from-[var(--color-primary)]/[0.05] via-[var(--color-surface)] to-[var(--color-surface)] border-[var(--color-primary)]/25 shadow-[0_2px_8px_rgba(255,56,92,0.06)]",
    default:
      "bg-[var(--color-surface)] border-[var(--color-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
    neutral:
      "bg-[var(--color-surface-hover)] border-[var(--color-border)]",
  }[accent];

  const trendColor = {
    up: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300",
    down: "text-rose-700 bg-rose-500/10 border-rose-500/20 dark:text-rose-300",
    neutral: "text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] border-[var(--color-border)]",
  }[trendDirection];

  return (
    <Card className={`space-y-3 p-5 sm:p-6 ${accentClasses}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>{label}</span>
        {icon && <span className="text-lg shrink-0">{icon}</span>}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </span>
          {unit && (
            <span className="text-sm font-bold text-[var(--color-primary)]">
              {unit}
            </span>
          )}
        </div>
        
        {trend && (
          <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold flex items-center gap-1 shrink-0 ${trendColor}`}>
            {trendDirection === "up" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            )}
            {trendDirection === "down" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
            )}
            <span>{trend}</span>
          </div>
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
