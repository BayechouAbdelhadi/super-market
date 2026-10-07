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
      "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20 text-[var(--color-text)]",
    default:
      "bg-[var(--color-surface)] border-[var(--color-border)]",
    neutral:
      "bg-[var(--color-surface-hover)] border-[var(--color-border)]",
  }[accent];

  const trendColor = {
    up: "text-green-600 bg-green-50 border-green-100",
    down: "text-red-600 bg-red-50 border-red-100",
    neutral: "text-gray-600 bg-gray-50 border-gray-100",
  }[trendDirection];

  return (
    <Card className={`space-y-3 p-5 ${accentClasses}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-[var(--color-text-muted)]">
              {unit}
            </span>
          )}
        </div>
        
        {trend && (
          <div className={`px-2 py-0.5 rounded-md border text-xs font-medium flex items-center gap-1 ${trendColor}`}>
            {trendDirection === "up" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            )}
            {trendDirection === "down" && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
            )}
            {trend}
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
