"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketingCampaign } from "@/lib/marketing/types";
import { DealJobDetailModal } from "./DealJobDetailModal";
import { EmailVisualizerModal } from "./EmailVisualizerModal";
import { toast } from "@/components/ui/sonner";
import {
  Sparkles,
  Play,
  Pause,
  Send,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Eye,
} from "lucide-react";

interface DealsSummary {
  totalCampaigns: number;
  activeJobs: number;
  totalEmailsSent: number;
  totalFailed: number;
}

interface DealsManagerProps {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export function DealsManager({
  storeName = "Super Market Calais",
  storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  storePhone = "06 71 54 05 28",
}: DealsManagerProps) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [summary, setSummary] = useState<DealsSummary>({
    totalCampaigns: 0,
    activeJobs: 0,
    totalEmailsSent: 0,
    totalFailed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [previewingCampaign, setPreviewingCampaign] = useState<MarketingCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "PAUSED">("ALL");

  const [runningActionId, setRunningActionId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/deals");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Erreur chargement campagnes:", err);
      toast.error("Impossible de charger les campagnes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Heartbeat every 60s to automatically trigger and display due jobs
    const timer = setInterval(() => {
      fetch("/api/admin/deals")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.campaigns) {
            setCampaigns(data.campaigns);
            if (data.summary) setSummary(data.summary);
          }
        })
        .catch(() => {});
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleRunBatch = async (campaign: MarketingCampaign) => {
    setRunningActionId(campaign.id);
    try {
      const res = await fetch(`/api/admin/deals/${campaign.id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'exécution du lot.");
      toast.success(data.message || "Lot traité avec succès !");
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'action.");
    } finally {
      setRunningActionId(null);
    }
  };

  const handlePause = async (campaign: MarketingCampaign) => {
    setRunningActionId(campaign.id);
    try {
      const res = await fetch(`/api/admin/deals/${campaign.id}/pause`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de pause.");
      toast.success("Job mis en pause.");
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'action.");
    } finally {
      setRunningActionId(null);
    }
  };

  const handleResume = async (campaign: MarketingCampaign) => {
    setRunningActionId(campaign.id);
    try {
      const res = await fetch(`/api/admin/deals/${campaign.id}/resume`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de reprise.");
      toast.success("Job repris.");
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'action.");
    } finally {
      setRunningActionId(null);
    }
  };

  const handleOpenDetail = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    setIsDetailModalOpen(true);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === "ACTIVE" && c.status !== "RUNNING" && c.status !== "SCHEDULED") return false;
    if (statusFilter === "COMPLETED" && c.status !== "COMPLETED") return false;
    if (statusFilter === "PAUSED" && c.status !== "PAUSED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.targetTiers.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Terminé
          </span>
        );
      case "RUNNING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 animate-pulse">
            En cours
          </span>
        );
      case "PAUSED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            En pause
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            Programmé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marketing Fidélité &amp; Campagnes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            Bons Plans &amp; Emails Clients
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl">
            Programmez des envois d&apos;emails pour informer vos clients de vos promotions, réductions et arrivages exclusifs selon leur palier fidélité.
          </p>
        </div>

        <Link href="/admin/deals/new">
          <Button
            variant="primary"
            size="md"
            className="gap-2 font-bold shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une campagne</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
            Total Campagnes
          </span>
          <strong className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text)] block">
            {summary.totalCampaigns}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            Jobs Actifs
          </span>
          <strong className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 block">
            {summary.activeJobs}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            Emails Délivrés
          </span>
          <strong className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
            {summary.totalEmailsSent}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
            Échecs Non-bloquants
          </span>
          <strong className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 block">
            {summary.totalFailed}
          </strong>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: `Toutes (${campaigns.length})` },
            { id: "ACTIVE", label: `Actives (${summary.activeJobs})` },
            { id: "PAUSED", label: "En pause" },
            { id: "COMPLETED", label: "Terminées" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[var(--color-text)] text-[var(--color-surface)] font-bold shadow-xs"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Rechercher une campagne..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            Chargement des campagnes et statistiques d&apos;envoi...
          </p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl p-12 text-center bg-[var(--color-surface)]/50 space-y-4">
          <div className="inline-flex p-3 rounded-full bg-[var(--color-surface-hover)] text-2xl">
            ✨
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              {searchQuery || statusFilter !== "ALL"
                ? "Aucune campagne ne correspond aux critères"
                : "Aucune campagne programmée pour le moment"}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
              Créez votre première opération commerciale pour envoyer des offres personnalisées par email à vos clients fidèles.
            </p>
          </div>
          <Link href="/admin/deals/new">
            <Button variant="primary" size="sm" className="gap-1.5 font-bold">
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une campagne</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((camp) => {
            const stats = camp.stats || {
              totalTargets: 0,
              sentCount: 0,
              failedCount: 0,
              remainingCount: 0,
              progressPercentage: 0,
            };

            const isActionRunning = runningActionId === camp.id;

            return (
              <Card
                key={camp.id}
                padded="md"
                className="space-y-4 hover:border-[var(--color-primary)]/40 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getStatusBadge(camp.status)}
                      <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                        {camp.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">
                      Objet : « {camp.subject} »
                    </p>
                  </div>

                  {/* Tier Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Cibles :</span>
                    {camp.targetTiers.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Bar & Real-time Advancement */}
                <div className="p-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--color-text)]">
                        {camp.dispatchMode === "ALL_AT_ONCE"
                          ? "Envoi groupé (One-shot)"
                          : `Quota : ${camp.dailyLimit || 100} / jour`}
                      </span>
                      <span className="text-[var(--color-text-muted)] opacity-50">•</span>
                      <span className="text-[var(--color-text-muted)]">
                        Période : {camp.startDate} au {camp.endDate} (🕐 {camp.scheduledTime || "00:00"})
                      </span>
                    </div>
                    <span className="font-mono text-[var(--color-primary)] font-bold">
                      {stats.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--color-border)]/60 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{
                        width: `${stats.totalTargets > 0 ? (stats.sentCount / stats.totalTargets) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{
                        width: `${stats.totalTargets > 0 ? (stats.failedCount / stats.totalTargets) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-text-muted)] pt-0.5 font-medium">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        ✅ {stats.sentCount} envoyé{stats.sentCount > 1 ? "s" : ""}
                      </span>
                      {stats.failedCount > 0 && (
                        <span className="text-rose-700 dark:text-rose-400 font-semibold">
                          ⚠️ {stats.failedCount} échec{stats.failedCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <span>⏳ {stats.remainingCount} restant{stats.remainingCount > 1 ? "s" : ""}</span>
                    </div>

                    <span>
                      Dernière exécution : {camp.lastRunDate || "En attente"}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {camp.status !== "COMPLETED" && stats.remainingCount > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRunBatch(camp)}
                        loading={isActionRunning}
                        className="gap-1.5 font-semibold text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {camp.dispatchMode === "ALL_AT_ONCE"
                            ? "Lancer l'envoi"
                            : `Traiter le lot du jour (${Math.min(stats.remainingCount, camp.dailyLimit || 100)})`}
                        </span>
                      </Button>
                    )}

                    {camp.status === "RUNNING" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePause(camp)}
                        loading={isActionRunning}
                        className="gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </Button>
                    )}

                    {camp.status === "PAUSED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResume(camp)}
                        loading={isActionRunning}
                        className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Reprendre</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewingCampaign(camp)}
                      className="gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 hover:bg-indigo-100/50"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Visualiser l&apos;email (vue consommateur)</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(camp)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <span>Détails &amp; Destinataires</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail / Logs Modal */}
      <DealJobDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        campaign={selectedCampaign}
        onRefresh={fetchCampaigns}
      />

      {/* Standalone Email Visualizer Modal */}
      {previewingCampaign && (
        <EmailVisualizerModal
          isOpen={!!previewingCampaign}
          onClose={() => setPreviewingCampaign(null)}
          title={previewingCampaign.title}
          subject={previewingCampaign.subject}
          content={previewingCampaign.content}
          imageUrl={previewingCampaign.imageUrl}
          ctaText={previewingCampaign.ctaText || "Découvrir les offres en magasin"}
          ctaUrl={previewingCampaign.ctaUrl || "https://supermarket-calais.fr"}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          targetTiers={previewingCampaign.targetTiers}
        />
      )}
    </div>
  );
}
