"use client";

import React, { useState } from "react";
import { DailySalesRecord } from "@/lib/loyalty/analytics-types";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/loyalty/analytics-domain";
import { Calendar, TrendingUp } from "lucide-react";

interface DailySalesChartProps {
  data: DailySalesRecord[];
}

export function DailySalesChart({ data }: DailySalesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);
  const totalPeriodRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodSales = data.reduce((sum, d) => sum + d.salesCount, 0);

  const activeDay = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <Card className="p-5 sm:p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
              Ventes Quotidiennes (7 derniers jours)
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Évolution réelle du chiffre d&apos;affaires et du nombre de tickets encaissés.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Cumul 7 jours
            </span>
            <span className="text-sm font-extrabold text-[var(--color-text)]">
              {formatCurrency(totalPeriodRevenue)} € ({formatNumber(totalPeriodSales)} tickets)
            </span>
          </div>
        </div>

        {/* Selected / Hovered Day Spotlight */}
        {activeDay && (
          <div className="mb-5 p-3.5 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--color-text)] block">
                  {activeDay.label} ({activeDay.date})
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {activeDay.salesCount > 0
                    ? `${activeDay.salesCount} ticket(s) encaissé(s)`
                    : "Aucune vente enregistrée ce jour"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                  Chiffre d&apos;affaires
                </span>
                <span className="text-sm font-extrabold text-[var(--color-primary)]">
                  {formatCurrency(activeDay.revenue)} €
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                  Points distribués
                </span>
                <span className="text-sm font-bold text-[var(--color-text)]">
                  +{formatNumber(activeDay.pointsEarned)} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bar Chart Visualization */}
        <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-1">
          {data.map((item, idx) => {
            const heightPercent =
              item.revenue > 0
                ? Math.max(Math.round((item.revenue / maxRevenue) * 100), 10)
                : 4; // subtle base height for 0€ days

            const isHovered = hoveredIndex === idx;
            const hasSales = item.revenue > 0;

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(idx)}
              >
                {/* Top Value Label */}
                <span
                  className={`text-[10px] font-bold mb-1.5 transition-all text-center whitespace-nowrap ${
                    isHovered
                      ? "opacity-100 text-[var(--color-text)] scale-105"
                      : "opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)]"
                  }`}
                >
                  {hasSales ? `${Math.round(item.revenue)}€` : "0€"}
                </span>

                {/* Bar */}
                <div className="w-full max-w-[42px] bg-[var(--color-surface-hover)] rounded-t-[8px] h-full flex items-end overflow-hidden p-0.5">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-[6px] transition-all duration-300 ${
                      !hasSales
                        ? "bg-[var(--color-border)]"
                        : isHovered
                        ? "bg-[var(--color-primary)] shadow-[0_0_10px_rgba(255,56,92,0.35)]"
                        : "bg-[var(--color-primary)]/80 hover:bg-[var(--color-primary)]"
                    }`}
                  />
                </div>

                {/* Day Label at Bottom */}
                <span
                  className={`text-[11px] mt-2 font-medium transition-colors ${
                    isHovered ? "font-bold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {item.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Données synchronisées en direct depuis la base Supabase</span>
        <span className="font-semibold text-[var(--color-text)]">
          {totalPeriodSales} transactions enregistrées
        </span>
      </div>
    </Card>
  );
}
