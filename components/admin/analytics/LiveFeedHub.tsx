"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { LiveFeedData, LiveOperationRecord } from "@/lib/loyalty/analytics-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/loyalty/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { formatCurrency } from "@/lib/loyalty/analytics-domain";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Gift,
  Store,
  Clock,
  RefreshCw,
  Coins,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Filter,
} from "lucide-react";

interface LiveFeedHubProps {
  initialData: LiveFeedData;
}

export function LiveFeedHub({ initialData }: LiveFeedHubProps) {
  const [data, setData] = useState<LiveFeedData>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PURCHASE" | "REDEEM">("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(
    new Date(initialData.generatedAt)
  );

  // Manual or automatic refresh handler
  const fetchLatestFeed = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.liveOperations) {
          setData((prev) => ({
            ...prev,
            operations: json.liveOperations,
            stats: {
              ...prev.stats,
              caToday: json.kpis?.caToday ?? prev.stats.caToday,
              operationsToday: json.kpis?.dailySalesCount ?? prev.stats.operationsToday,
              pointsEarnedToday: json.kpis?.dailyPointsEarned ?? prev.stats.pointsEarnedToday,
              pointsRedeemedToday: json.kpis?.dailyPointsRedeemed ?? prev.stats.pointsRedeemedToday,
              totalLoaded: json.liveOperations.length,
            },
            generatedAt: new Date().toISOString(),
          }));
          setLastRefreshedAt(new Date());
        }
      }
    } catch (err) {
      console.error("Erreur actualisation flux direct :", err);
    }
  };

  const handleManualRefresh = () => {
    startRefreshTransition(async () => {
      await fetchLatestFeed();
    });
  };

  // Optional 15-second background auto-polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLatestFeed();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter operations by search and type
  const filteredOperations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return data.operations.filter((op) => {
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "PURCHASE" && op.type === "PURCHASE") ||
        (typeFilter === "REDEEM" && op.type === "REDEEM");

      if (!matchesType) return false;

      if (!q) return true;

      const customer = op.customerName.toLowerCase();
      const email = (op.customerEmail || "").toLowerCase();
      const cashier = op.cashierName.toLowerCase();
      const id = op.id.toLowerCase();

      return customer.includes(q) || email.includes(q) || cashier.includes(q) || id.includes(q);
    });
  }, [data.operations, searchQuery, typeFilter]);

  // Pagination hook
  const {
    paginatedItems,
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination(filteredOperations, {
    defaultPageSize: LOYALTY_CONFIG.pagination.tablePageSize,
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Flux des Opérations en Direct
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>En direct</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Supervisez les encaissements, achats et utilisations d&apos;avantages fidélité en temps réel.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span>Auto-rafraîchissement (15s)</span>
          </label>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            loading={isRefreshing}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </Button>

          <Link href="/cashier">
            <Button variant="primary" size="sm" className="gap-2 text-xs font-bold shadow-sm">
              <Store className="w-3.5 h-3.5" />
              <span>Ouvrir caisse</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Chiffre d&apos;Affaires</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-[var(--color-text)]">
            {formatCurrency(data.stats.caToday)} €
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Total des encaissements aujourd&apos;hui
          </div>
        </Card>

        <Card className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Transactions</span>
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-[var(--color-text)]">
            {data.stats.operationsToday}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Passages en caisse enregistrés
          </div>
        </Card>

        <Card className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Points Distribués</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +{data.stats.pointsEarnedToday.toLocaleString("fr-FR")} pts
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            1 € dépensé = 1 point crédité
          </div>
        </Card>

        <Card className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Points Consommés</span>
            <ArrowDownLeft className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-[var(--color-primary)]">
            -{data.stats.pointsRedeemedToday.toLocaleString("fr-FR")} pts
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Avantages et remises utilisés
          </div>
        </Card>
      </div>

      {/* Control Bar: Search + Type Filter Chips */}
      <Card className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par client, caissier, ID..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
            <span className="text-[var(--color-text-muted)] text-[11px] uppercase mr-1 hidden sm:inline">
              Type :
            </span>
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Tous ({data.operations.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("PURCHASE")}
              className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                typeFilter === "PURCHASE"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Achats &amp; Crédits</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("REDEEM")}
              className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                typeFilter === "REDEEM"
                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Remises &amp; Débits</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]/50">
          <span>
            Affichage de <strong>{filteredOperations.length}</strong> opération{filteredOperations.length > 1 ? "s" : ""}
            {searchQuery ? ` pour « ${searchQuery} »` : ""}
          </span>
          <span>
            Dernière mise à jour à {lastRefreshedAt.toLocaleTimeString("fr-FR")}
          </span>
        </div>
      </Card>

      {/* Main Stream Card */}
      <Card className="p-5 sm:p-6 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        {filteredOperations.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 px-4">
            <div className="h-14 w-14 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] text-xl">
              🔍
            </div>
            <div>
              <p className="text-base font-bold text-[var(--color-text)]">
                Aucune opération trouvée
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mt-1">
                {searchQuery || typeFilter !== "ALL"
                  ? "Modifiez vos filtres ou votre mot-clé de recherche pour afficher les événements."
                  : "Les prochains achats ou remises de points effectués en caisse apparaîtront ici automatiquement."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {paginatedItems.map((op) => {
                const isPurchase = op.type === "PURCHASE";
                const isEarn = op.pointsEarned > 0;

                return (
                  <div
                    key={op.id}
                    className="p-4 rounded-[var(--radius-card,14px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--color-border-hover)] hover:shadow-2xs transition-all"
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                          isPurchase
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20"
                        }`}
                      >
                        {isPurchase ? (
                          <ShoppingCart className="w-5 h-5" />
                        ) : (
                          <Gift className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-[var(--color-text)] truncate">
                            {op.customerName}
                          </span>
                          <StatusBadge status={op.customerTier} size="sm" />
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)] px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                            #{op.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[var(--color-text)]">
                            {op.cashierName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
                            {op.formattedTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right details */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-border)] shrink-0">
                      <div className="font-extrabold text-sm sm:text-base text-[var(--color-text)]">
                        {op.amount > 0 ? `${formatCurrency(op.amount)} €` : "Remise 100% fidélité"}
                      </div>

                      <div
                        className={`text-xs font-bold inline-flex items-center gap-1 mt-0.5 ${
                          isEarn
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[var(--color-primary)]"
                        }`}
                      >
                        {isEarn ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+{op.pointsEarned} points crédités</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>-{op.pointsRedeemed} points déduits</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="pt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                alwaysShow={true}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
