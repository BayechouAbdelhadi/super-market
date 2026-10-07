"use client";

import React from "react";
import Link from "next/link";
import { LiveOperationRecord } from "@/lib/loyalty/analytics-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/loyalty/analytics-domain";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Gift,
  Store,
  Clock,
} from "lucide-react";

interface LiveOperationsFeedProps {
  operations: LiveOperationRecord[];
}

export function LiveOperationsFeed({ operations }: LiveOperationsFeedProps) {
  const hasOperations = operations && operations.length > 0;

  return (
    <Card className="p-5 sm:p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
              Flux des Opérations en Direct
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <span className="text-xs text-[var(--color-text-muted)] font-medium">
            {hasOperations ? `${operations.length} dernières opérations` : "En attente"}
          </span>
        </div>

        {/* Content */}
        {!hasOperations ? (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-3 px-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">
                Aucune transaction enregistrée
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mt-1">
                Les achats et remises de points enregistrés en caisse apparaîtront ici automatiquement en temps réel.
              </p>
            </div>
            <Link href="/cashier" className="pt-2">
              <Button variant="primary" size="sm" className="font-bold gap-2">
                <span>Ouvrir l&apos;espace caisse</span>
                <span>→</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {operations.map((op) => {
              const isPurchase = op.type === "PURCHASE";
              const isEarn = op.pointsEarned > 0;

              return (
                <div
                  key={op.id}
                  className="p-3.5 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between gap-3 hover:border-[var(--color-border-hover)] transition-all"
                >
                  {/* Left: Icon + Customer + Cashier */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${
                        isPurchase
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20"
                      }`}
                    >
                      {isPurchase ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-text)] truncate">
                          {op.customerName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase border ${
                            op.customerTier === "VIP"
                              ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30"
                              : op.customerTier === "GOLD"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                          }`}
                        >
                          {op.customerTier}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                        <span>{op.cashierName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {op.formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount and Points */}
                  <div className="text-right shrink-0">
                    {op.amount > 0 ? (
                      <div className="font-extrabold text-xs sm:text-sm text-[var(--color-text)]">
                        {formatCurrency(op.amount)} €
                      </div>
                    ) : (
                      <div className="font-bold text-xs text-[var(--color-primary)]">
                        Remise fidélité
                      </div>
                    )}

                    <div
                      className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-0.5 ${
                        isEarn
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--color-primary)]"
                      }`}
                    >
                      {isEarn ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          +{op.pointsEarned} pts
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          -{op.pointsRedeemed} pts
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Flux alimenté directement par les encaissements caisse</span>
        <Link href="/cashier" className="text-[var(--color-primary)] font-semibold hover:underline">
          Accéder à la caisse →
        </Link>
      </div>
    </Card>
  );
}
