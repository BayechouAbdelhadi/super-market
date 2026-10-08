"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "./StatusBadge";

interface CustomerDetailViewProps {
  customer: CustomerDetail;
  onBack: () => void;
  onOpenAddPurchase: () => void;
  onOpenRedeemPoints: () => void;
}

export function CustomerDetailView({
  customer,
  onBack,
  onOpenAddPurchase,
  onOpenRedeemPoints,
}: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"purchases" | "movements">("purchases");

  // Calcul du palier suivant pour la jauge
  const nextTierInfo = (() => {
    const tierUpper = (customer.tier || "BRONZE").toUpperCase();
    switch (tierUpper) {
      case "BRONZE":
        return {
          nextTier: "Silver",
          remaining: Math.max(0, 500 - customer.historical_points),
          percent: Math.min(100, Math.round((customer.historical_points / 500) * 100)),
        };
      case "SILVER":
        return {
          nextTier: "Gold",
          remaining: Math.max(0, 2000 - customer.historical_points),
          percent: Math.min(
            100,
            Math.round(((customer.historical_points - 500) / (2000 - 500)) * 100),
          ),
        };
      case "GOLD":
        return {
          nextTier: "VIP",
          remaining: Math.max(0, 5000 - customer.historical_points),
          percent: Math.min(
            100,
            Math.round(((customer.historical_points - 2000) / (5000 - 2000)) * 100),
          ),
        };
      case "VIP":
      default:
        return {
          nextTier: "Niveau Max",
          remaining: 0,
          percent: 100,
        };
    }
  })();

  const purchases = customer.purchases || [];
  const movements = customer.movements || [];

  const initials = customer.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CL";

  const tierGradients: Record<string, string> = {
    bronze: "from-amber-600/20 to-amber-700/10 text-amber-900 border-amber-300",
    silver: "from-slate-400/20 to-slate-500/10 text-slate-800 border-slate-300",
    gold: "from-amber-400/30 to-yellow-500/15 text-amber-950 border-amber-400",
    vip: "from-zinc-900 to-zinc-800 text-white border-zinc-900",
  };

  const avatarStyle =
    tierGradients[(customer.tier || "").toLowerCase()] ||
    "from-[var(--color-surface-hover)] to-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]";

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Retour à la recherche client</span>
        </Button>
      </div>

      {/* Main Customer Summary Card (§ 8 & § 17) */}
      <Card padded="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`h-16 w-16 rounded-full bg-gradient-to-br ${avatarStyle} border-2 flex items-center justify-center font-extrabold text-xl tracking-tight shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}
            >
              {initials}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                  {customer.full_name}
                </h1>
                <StatusBadge status={customer.tier} size="lg" />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[var(--color-text-muted)] font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <span>📱</span> {customer.phone}
                </span>
                <span className="opacity-30">•</span>
                <span className="inline-flex items-center gap-1.5 font-sans">
                  <span>✉️</span> {customer.email}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Cashier Actions (§ 5 & § 17) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenAddPurchase}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Ajouter un achat</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              disabled={customer.available_points <= 0}
              onClick={onOpenRedeemPoints}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
              <span>- Utiliser des points</span>
            </Button>
          </div>
        </div>

        {/* Points Stat Cards (§ 8 & § 17) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Points Disponibles"
            value={customer.available_points}
            unit="pts"
            description="Solde immédiatement utilisable pour des remises en caisse."
            icon="🎟️"
            accent="brand"
          />

          <StatCard
            label="Points Historiques"
            value={customer.historical_points}
            unit="pts"
            description="Total cumulé à vie qui détermine le statut (ne baisse jamais)."
            icon="🏆"
            accent="neutral"
          />
        </div>

        {/* Tier progress (§ 13 & § 17) */}
        {customer.tier !== "VIP" && (
          <div className="p-4 sm:p-5 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-muted)]">
                  Progression vers le palier :
                </span>
                <span className="font-bold text-[var(--color-text)] bg-[var(--color-surface)] px-2.5 py-0.5 rounded-full border border-[var(--color-border)] shadow-xs">
                  {nextTierInfo.nextTier}
                </span>
              </div>
              <span className="font-semibold text-[var(--color-primary)]">
                Plus que {nextTierInfo.remaining.toLocaleString("fr-FR")} points nécessaires ({nextTierInfo.percent}%)
              </span>
            </div>
            <div className="w-full bg-[var(--color-border)] h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.max(5, nextTierInfo.percent)}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* History Sections */}
      <Card padded={false} className="overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-[var(--color-border)] px-6 pt-4 gap-4">
          <button
            onClick={() => setActiveTab("purchases")}
            type="button"
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "purchases"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            Historique des achats ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            type="button"
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "movements"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            Mouvements de points ({movements.length})
          </button>
        </div>

        {/* Tab Content: Purchases */}
        {activeTab === "purchases" && (
          <div className="p-6">
            {purchases.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic text-center py-8">
                Aucun achat enregistré pour ce client.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Montant du ticket</th>
                      <th className="pb-3">Points</th>
                      <th className="pb-3">Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[var(--color-border)]">
                    {purchases.map((p) => {
                      const dateFormatted = new Date(p.transaction_date).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      );
                      const isEarn = p.points_earned > 0;
                      const isRedeem = (p.points_redeemed || 0) > 0;

                      return (
                        <tr key={p.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="py-3 font-mono text-[var(--color-text-muted)]">
                            {dateFormatted}
                          </td>
                          <td className="py-3 font-bold text-[var(--color-text)]">
                            {p.amount.toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            €
                          </td>
                          <td className="py-3">
                            {isEarn ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full text-xs">
                                +{p.points_earned} points
                              </span>
                            ) : isRedeem ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-0.5 rounded-full text-xs">
                                -{p.points_redeemed} points
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-2.5 py-0.5 rounded-full text-xs">
                                0 point
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-[var(--color-text-muted)]">{p.created_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Movements */}
        {activeTab === "movements" && (
          <div className="p-6">
            {movements.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic text-center py-8">
                Aucun mouvement de points historisé.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Points</th>
                      <th className="pb-3">Motif</th>
                      <th className="pb-3">Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {movements.map((m) => {
                      const dateFormatted = new Date(m.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const isEarn = m.type === "EARN";
                      const isRedeem = m.type === "REDEEM";

                      return (
                        <tr key={m.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="py-3 font-mono text-[var(--color-text-muted)]">
                            {dateFormatted}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isEarn
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : isRedeem
                                    ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td
                            className={`py-3 font-bold ${
                              isEarn ? "text-[var(--color-primary)]" : "text-[var(--color-danger)]"
                            }`}
                          >
                            {isEarn ? `+${m.amount}` : `-${m.amount}`}
                          </td>
                          <td className="py-3 text-[var(--color-text)]">
                            {m.reason || "—"}
                          </td>
                          <td className="py-3 text-[var(--color-text-muted)]">{m.created_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
