"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { RealDashboardData } from "@/lib/loyalty/analytics-types";
import { DashboardKpis } from "./DashboardKpis";
import { DailySalesChart } from "./DailySalesChart";
import { Button } from "@/components/ui/button";
import { RefreshCw, Store, Users, ShoppingBag, Activity } from "lucide-react";

interface AnalyticsDashboardProps {
  initialData: RealDashboardData;
}

export function AnalyticsDashboard({ initialData }: AnalyticsDashboardProps) {
  const [data, setData] = useState<RealDashboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const freshData: RealDashboardData = await res.json();
          setData(freshData);
        }
      } catch (err) {
        console.error("Erreur lors de l'actualisation:", err);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Tableau de Bord
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base Supabase • Synchronisée</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Indicateurs d&apos;activité commerciale, tendances de vente et synthèse des performances du magasin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5 text-xs font-semibold h-9 rounded-full border-[var(--color-border)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </Button>

          <Link href="/cashier">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs font-bold h-9 rounded-full shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ouvrir la caisse</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Simplified KPIs Grid */}
      <DashboardKpis kpis={data.kpis} />

      {/* 2. Full-Width Daily Sales Trend Chart */}
      <div>
        <DailySalesChart data={data.dailySalesTrend} />
      </div>

      {/* 3. Quick Links Footer */}
      <div className="pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-3">
        <div className="flex items-center gap-2">
          <span>SuperMarket Calais</span>
          <span>•</span>
          <span>Données 100% synchronisées avec Supabase</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/admin/live"
            className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Flux en direct</span>
          </Link>
          <Link
            href="/customers"
            className="hover:text-[var(--color-text)] transition-colors flex items-center gap-1 font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gérer les clients ({data.kpis.totalClients})</span>
          </Link>
          <Link
            href="/admin/cashiers"
            className="hover:text-[var(--color-text)] transition-colors flex items-center gap-1 font-medium"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Équipe caissiers ({data.totalCashiersCount})</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
