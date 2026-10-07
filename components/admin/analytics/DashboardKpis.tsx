"use client";

import React from "react";
import { DashboardKpis as DashboardKpisType } from "@/lib/loyalty/analytics-types";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/loyalty/analytics-domain";
import {
  CreditCard,
  ShoppingBag,
  Sparkles,
  Users,
  TrendingUp,
  Gift,
} from "lucide-react";

interface DashboardKpisProps {
  kpis: DashboardKpisType;
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  const cards = [
    {
      id: "ca-today",
      label: "Chiffre d'Affaires Aujourd'hui",
      value: `${formatCurrency(kpis.caToday)} €`,
      subtext: `Total cumulé magasin : ${formatCurrency(kpis.caTotal)} €`,
      icon: <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />,
      accent: "border-[var(--color-primary)]/30 shadow-[0_2px_12px_rgba(255,56,92,0.06)] bg-gradient-to-br from-[var(--color-primary)]/[0.04] to-transparent",
      badge: "Aujourd'hui",
      badgeColor: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20",
    },
    {
      id: "ca-total",
      label: "Chiffre d'Affaires Total",
      value: `${formatCurrency(kpis.caTotal)} €`,
      subtext: `Sur l'ensemble des encaissements`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      accent: "border-[var(--color-border)]",
      badge: "Global",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      id: "daily-sales",
      label: "Ventes du Jour (Tickets)",
      value: `${formatNumber(kpis.dailySalesCount)}`,
      unit: "tickets",
      subtext: `${formatNumber(kpis.totalSalesCount)} tickets au total`,
      icon: <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      accent: "border-[var(--color-border)]",
      badge: "Activité caisse",
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "daily-points-used",
      label: "Points Utilisés Aujourd'hui",
      value: `${formatNumber(kpis.dailyPointsRedeemed)}`,
      unit: "pts",
      subtext: `${formatNumber(kpis.totalPointsRedeemed)} pts utilisés au total`,
      icon: <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      accent: "border-[var(--color-border)]",
      badge: "Remises fidélité",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: "new-clients-today",
      label: "Nouveaux Clients Aujourd'hui",
      value: `${formatNumber(kpis.newClientsToday)}`,
      unit: "inscrits",
      subtext: `${formatNumber(kpis.totalClients)} clients enregistrés`,
      icon: <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      accent: "border-[var(--color-border)]",
      badge: "Adhésions",
      badgeColor: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    },
    {
      id: "points-earned-today",
      label: "Points Distribués Aujourd'hui",
      value: `${formatNumber(kpis.dailyPointsEarned)}`,
      unit: "pts",
      subtext: `${formatNumber(kpis.totalPointsEarned)} pts distribués au total`,
      icon: <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      accent: "border-[var(--color-border)]",
      badge: "Barème 1 € = 1 pt",
      badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card) => (
        <Card
          key={card.id}
          className={`p-5 sm:p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border transition-all duration-200 hover:shadow-sm ${card.accent} flex flex-col justify-between`}
        >
          {/* Header: Label + Icon */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] leading-tight">
              {card.label}
            </span>
            <div className="h-9 w-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              {card.icon}
            </div>
          </div>

          {/* Value + Badge */}
          <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {card.unit}
                </span>
              )}
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${card.badgeColor}`}
            >
              {card.badge}
            </span>
          </div>

          {/* Footer Subtitle */}
          <div className="pt-2.5 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            {card.subtext}
          </div>
        </Card>
      ))}
    </div>
  );
}
