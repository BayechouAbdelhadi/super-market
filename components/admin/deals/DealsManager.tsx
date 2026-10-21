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
  Plus,
  Search,
  ChevronRight,
  Eye,
  Edit3,
} from "lucide-react";
import { getSiteUrl } from "@/lib/utils/app-url";

type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "COMPLETED" | "PAUSED";

interface DealsSummary {
  totalCampaigns: number;
  activeJobs: number;
  totalEmailsSent: number;
  totalFailed: number;
}

interface CampaignList {
  campaigns: MarketingCampaign[];
  summary?: DealsSummary;
}

/** Background refresh of the list: also makes due batches run. */
const CAMPAIGN_LIST_REFRESH_MS = 60_000;

/** Campaign list from the API (null when the server answers an error status). */
async function requestCampaignList(): Promise<CampaignList | null> {
  const res = await fetch("/api/admin/deals");
  if (!res.ok) return null;
  const data = await res.json();
  return { campaigns: data.campaigns || [], summary: data.summary };
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [runningActionId, setRunningActionId] = useState<string | null>(null);

  const applyList = (list: CampaignList | null) => {
    if (!list) return;
    setCampaigns(list.campaigns);
    if (list.summary) setSummary(list.summary);
  };

  const loadFailed = (err: unknown) => {
    console.error("Erreur chargement campagnes:", err);
    toast.error("Impossible de charger les campagnes.");
  };

  /** Reload with the spinner (after an action). */
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      applyList(await requestCampaignList());
    } catch (err) {
      loadFailed(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // `loading` starts true: the first load needs no spinner toggle
    requestCampaignList()
      .then(applyList)
      .catch(loadFailed)
      .finally(() => setLoading(false));
    // Heartbeat every 60s to automatically trigger and display due jobs (silent on failure)
    const timer = setInterval(() => {
      requestCampaignList()
        .then(applyList)
        .catch(() => {});
    }, CAMPAIGN_LIST_REFRESH_MS);
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'action.");
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'action.");
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'action.");
    } finally {
      setRunningActionId(null);
    }
  };

  const handleOpenDetail = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign);
    setIsDetailModalOpen(true);
  };

  // Filter campaigns
  const draftCount = campaigns.filter((c) => c.status === "DRAFT").length;

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === "ACTIVE" && c.status !== "RUNNING" && c.status !== "SCHEDULED") return false;
    if (statusFilter === "DRAFT" && c.status !== "DRAFT") return false;
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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success-subtle text-success-text border border-success-border">
            Terminé
          </span>
        );
      case "RUNNING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-info-subtle text-info-text border border-info-border animate-pulse">
            En cours
          </span>
        );
      case "PAUSED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warning-subtle text-warning-text border border-warning-border">
            En pause
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-highlight-subtle text-highlight-text border border-highlight-border">
            Programmé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-hover text-text border border-border">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover)] border border-[var(--color-border)] shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marketing Fidélité &amp; Campagnes</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            Bons Plans &amp; Emails Clients
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl">
            Programmez des envois d&apos;emails pour informer vos clients de vos promotions, réductions et arrivages exclusifs selon leur palier fidélité.
          </p>
        </div>

        <Link href="/admin/deals/new" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto gap-2 font-bold justify-center shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une campagne</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
            Total Campagnes
          </span>
          <strong className="text-lg sm:text-2xl font-bold font-mono text-[var(--color-text)] block">
            {summary.totalCampaigns}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-info-text uppercase tracking-wider block">
            Jobs Actifs
          </span>
          <strong className="text-lg sm:text-2xl font-bold font-mono text-info-text block">
            {summary.activeJobs}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-success-text uppercase tracking-wider block">
            Emails Délivrés
          </span>
          <strong className="text-lg sm:text-2xl font-bold font-mono text-success-text block">
            {summary.totalEmailsSent}
          </strong>
        </Card>

        <Card padded="sm" className="space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
            Échecs Non-bloquants
          </span>
          <strong className="text-lg sm:text-2xl font-bold font-mono text-danger-text block">
            {summary.totalFailed}
          </strong>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {([
            { id: "ALL", label: `Toutes (${campaigns.length})` },
            { id: "ACTIVE", label: `Actives (${summary.activeJobs})` },
            { id: "DRAFT", label: `Brouillons (${draftCount})` },
            { id: "PAUSED", label: "En pause" },
            { id: "COMPLETED", label: "Terminées" },
          ] satisfies { id: StatusFilter; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl p-8 sm:p-12 text-center bg-[var(--color-surface)]/50 space-y-4">
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
                className="space-y-4 hover:border-[var(--color-primary)]/40 transition-all shadow-xs min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(camp.status)}
                      <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight break-words">
                        {camp.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium break-words">
                      Objet : « {camp.subject} »
                    </p>
                  </div>

                  {/* Tier Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
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
                <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-semibold">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[var(--color-text)] font-bold">
                        {camp.dispatchMode === "ALL_AT_ONCE"
                          ? "Envoi groupé (One-shot)"
                          : `Quota : ${camp.dailyLimit || 100}/jour`}
                      </span>
                      <span className="text-[var(--color-text-muted)] opacity-50 hidden sm:inline">•</span>
                      <span className="text-[var(--color-text-muted)] text-[11px] sm:text-xs">
                        Période : {camp.startDate} au {camp.endDate} (🕐 {camp.scheduledTime || "00:00"})
                      </span>
                    </div>
                    <span className="font-mono text-[var(--color-primary)] font-bold self-start sm:self-auto">
                      {stats.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--color-border)]/60 overflow-hidden flex">
                    <div
                      className="bg-success h-full transition-all duration-500"
                      style={{
                        width: `${stats.totalTargets > 0 ? (stats.sentCount / stats.totalTargets) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-danger h-full transition-all duration-500"
                      style={{
                        width: `${stats.totalTargets > 0 ? (stats.failedCount / stats.totalTargets) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[var(--color-text-muted)] pt-0.5 font-medium">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-success-text font-semibold">
                        ✅ {stats.sentCount} envoyé{stats.sentCount > 1 ? "s" : ""}
                      </span>
                      {stats.failedCount > 0 && (
                        <span className="text-danger-text font-semibold">
                          ⚠️ {stats.failedCount} échec{stats.failedCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <span>⏳ {stats.remainingCount} restant{stats.remainingCount > 1 ? "s" : ""}</span>
                    </div>

                    <span className="text-[10px] sm:text-[11px]">
                      Dernière exécution : {camp.lastRunDate || "En attente"}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {camp.status === "DRAFT" ? (
                      <Link href={`/admin/deals/new?draftId=${camp.id}`} className="w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full sm:w-auto justify-center gap-1.5 font-semibold text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Reprendre l&apos;édition</span>
                        </Button>
                      </Link>
                    ) : camp.status !== "COMPLETED" && stats.remainingCount > 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRunBatch(camp)}
                        loading={isActionRunning}
                        className="w-full sm:w-auto justify-center gap-1.5 font-semibold text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {camp.dispatchMode === "ALL_AT_ONCE"
                            ? "Lancer l'envoi"
                            : `Traiter le lot (${Math.min(stats.remainingCount, camp.dailyLimit || 100)})`}
                        </span>
                      </Button>
                    ) : null}

                    {camp.status === "RUNNING" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePause(camp)}
                        loading={isActionRunning}
                        className="w-full sm:w-auto justify-center gap-1.5 text-xs text-warning-text font-semibold"
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
                        className="w-full sm:w-auto justify-center gap-1.5 text-xs text-success-text font-semibold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Reprendre</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewingCampaign(camp)}
                      className="w-full sm:w-auto justify-center gap-1.5 text-xs font-bold text-info-text border-info-border bg-info-subtle hover:bg-info-subtle"
                    >
                      <Eye className="w-3.5 h-3.5 text-info-text shrink-0" />
                      <span>Visualiser l&apos;email</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(camp)}
                      className="w-full sm:w-auto justify-center gap-1.5 text-xs font-semibold"
                    >
                      <span>Détails &amp; Destinataires</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
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
          ctaUrl={previewingCampaign.ctaUrl || getSiteUrl()}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          targetTiers={previewingCampaign.targetTiers}
        />
      )}
    </div>
  );
}
