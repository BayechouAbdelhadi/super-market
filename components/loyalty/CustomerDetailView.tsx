"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
    switch (customer.tier) {
      case "Bronze":
        return {
          nextTier: "Silver",
          remaining: Math.max(0, 500 - customer.historical_points),
          percent: Math.min(100, Math.round((customer.historical_points / 500) * 100)),
        };
      case "Silver":
        return {
          nextTier: "Gold",
          remaining: Math.max(0, 2000 - customer.historical_points),
          percent: Math.min(
            100,
            Math.round(((customer.historical_points - 500) / (2000 - 500)) * 100),
          ),
        };
      case "Gold":
        return {
          nextTier: "VIP",
          remaining: Math.max(0, 5000 - customer.historical_points),
          percent: Math.min(
            100,
            Math.round(((customer.historical_points - 2000) / (5000 - 2000)) * 100),
          ),
        };
      case "VIP":
        return {
          nextTier: "Niveau Max",
          remaining: 0,
          percent: 100,
        };
    }
  })();

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2"
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
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                {customer.full_name}
              </h1>
              <StatusBadge status={customer.tier} size="lg" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)] font-mono">
              <span className="inline-flex items-center gap-1.5">
                <span>📱</span> {customer.phone}
              </span>
              <span className="opacity-40">•</span>
              <span className="inline-flex items-center gap-1.5 font-sans">
                <span>✉️</span> {customer.email}
              </span>
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
          <div className="p-4 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-[var(--color-text-muted)]">
                Progression vers le statut <strong className="text-[var(--color-text)]">{nextTierInfo.nextTier}</strong>
              </span>
              <span className="font-semibold text-[var(--color-text)]">
                Plus que {nextTierInfo.remaining.toLocaleString("fr-FR")} pts
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500"
                style={{ width: `${nextTierInfo.percent}%` }}
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
            Historique des achats ({customer.purchases.length})
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
            Mouvements de points ({customer.movements.length})
          </button>
        </div>

        {/* Tab Content: Purchases */}
        {activeTab === "purchases" && (
          <div className="p-6">
            {customer.purchases.length === 0 ? (
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
                      <th className="pb-3">Points gagnés</th>
                      <th className="pb-3">Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {customer.purchases.map((p) => {
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
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full text-xs">
                              +{p.points_earned} points
                            </span>
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
            {customer.movements.length === 0 ? (
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
                    {customer.movements.map((m) => {
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
