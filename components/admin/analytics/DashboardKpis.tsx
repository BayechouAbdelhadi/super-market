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
  euroToPointsRatio?: number;
}

export function DashboardKpis({ kpis, euroToPointsRatio = 1 }: DashboardKpisProps) {
  const cards = [
    {
      id: "ca-today",
      label: "Chiffre d'Affaires Aujourd'hui",
      value: `${formatCurrency(kpis.caToday)} €`,
      subtext: `Total cumulé magasin : ${formatCurrency(kpis.caTotal)} €`,
      icon: <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />,
      accent: "border-[var(--color-primary)]/30 shadow-[var(--shadow-subtle)] bg-gradient-to-br from-[var(--color-primary)]/[0.04] to-transparent",
      badge: "Aujourd'hui",
      badgeColor: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20",
    },
    {
      id: "ca-total",
      label: "Chiffre d'Affaires Total",
      value: `${formatCurrency(kpis.caTotal)} €`,
      subtext: `Sur l'ensemble des encaissements`,
      icon: <TrendingUp className="w-5 h-5 text-success-text" />,
      accent: "border-[var(--color-border)]",
      badge: "Global",
      badgeColor: "bg-success-subtle text-success-text border-success-border",
    },
    {
      id: "daily-sales",
      label: "Ventes du Jour (Tickets)",
      value: `${formatNumber(kpis.dailySalesCount)}`,
      unit: "tickets",
      subtext: `${formatNumber(kpis.totalSalesCount)} tickets au total`,
      icon: <ShoppingBag className="w-5 h-5 text-info-text" />,
      accent: "border-[var(--color-border)]",
      badge: "Activité caisse",
      badgeColor: "bg-info-subtle text-info-text border-info-border",
    },
    {
      id: "daily-points-used",
      label: "Points Utilisés Aujourd'hui",
      value: `${formatNumber(kpis.dailyPointsRedeemed)}`,
      unit: "pts",
      subtext: `${formatNumber(kpis.totalPointsRedeemed)} pts utilisés au total`,
      icon: <Gift className="w-5 h-5 text-warning-text" />,
      accent: "border-[var(--color-border)]",
      badge: "Remises fidélité",
      badgeColor: "bg-warning-subtle text-warning-text border-warning-border",
    },
    {
      id: "new-clients-today",
      label: "Nouveaux Clients Aujourd'hui",
      value: `${formatNumber(kpis.newClientsToday)}`,
      unit: "inscrits",
      subtext: `${formatNumber(kpis.totalClients)} clients enregistrés`,
      icon: <Users className="w-5 h-5 text-success-text" />,
      accent: "border-[var(--color-border)]",
      badge: "Adhésions",
      badgeColor: "bg-success-subtle text-success-text border-success-border",
    },
    {
      id: "points-earned-today",
      label: "Points Distribués Aujourd'hui",
      value: `${formatNumber(kpis.dailyPointsEarned)}`,
      unit: "pts",
      subtext: `${formatNumber(kpis.totalPointsEarned)} pts distribués au total`,
      icon: <Sparkles className="w-5 h-5 text-highlight-text" />,
      accent: "border-[var(--color-border)]",
      badge: `Barème 1 € = ${euroToPointsRatio} pt${euroToPointsRatio > 1 ? "s" : ""}`,
      badgeColor: "bg-highlight-subtle text-highlight-text border-highlight-border",
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
