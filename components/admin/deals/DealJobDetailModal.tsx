"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { MarketingCampaign, CampaignRecipient } from "@/lib/marketing/types";
import { toast } from "@/components/ui/sonner";
import {
  Play,
  Pause,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Layers,
  ChevronDown,
  RefreshCw,
  Search,
} from "lucide-react";

interface DealJobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: MarketingCampaign | null;
  onRefresh: () => void;
}

export function DealJobDetailModal({
  isOpen,
  onClose,
  campaign,
  onRefresh,
}: DealJobDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<"ALL" | "SENT" | "FAILED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !campaign) return null;

  const stats = campaign.stats || {
    totalTargets: 0,
    sentCount: 0,
    failedCount: 0,
    remainingCount: 0,
    progressPercentage: 0,
  };

  const recipients = campaign.recipients || [];

  const filteredRecipients = recipients.filter((r) => {
    if (recipientFilter !== "ALL" && r.status !== recipientFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.tier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleRunBatch() {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/deals/${campaign?.id}/run`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors du lancement du lot.");
      toast.success(data.message || "Lot traité avec succès !");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'exécution.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handlePause() {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/deals/${campaign?.id}/pause`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la mise en pause.");
      toast.success("Job mis en pause.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'action.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleResume() {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/deals/${campaign?.id}/resume`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la reprise.");
      toast.success("Job repris avec succès.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'action.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement la campagne « ${campaign?.title} » ?`)) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/deals/${campaign?.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de suppression.");
      toast.success("Campagne supprimée.");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression.");
    } finally {
      setLoadingAction(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Terminé</span>;
      case "RUNNING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 animate-pulse">En cours</span>;
      case "PAUSED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">En pause</span>;
      case "SCHEDULED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">Programmé</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">Brouillon</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaign.title}
      icon="📊"
      description={
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {getStatusBadge(campaign.status)}
          <span className="text-[var(--color-text-muted)] opacity-50">·</span>
          <span className="font-medium text-[var(--color-text)]">
            {campaign.dispatchMode === "ALL_AT_ONCE" ? "Envoi groupé (One-shot)" : `Quota ${campaign.dailyLimit}/jour`}
          </span>
          <span className="text-[var(--color-text-muted)] opacity-50">·</span>
          <span className="text-[var(--color-text-muted)]">
            Du {campaign.startDate} au {campaign.endDate}
          </span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="p-6 space-y-6">
        {/* Real-time KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Audience ciblée
            </span>
            <strong className="text-xl font-bold font-mono text-[var(--color-text)] block mt-0.5">
              {stats.totalTargets}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Envoyés avec succès
            </span>
            <strong className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {stats.sentCount}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
              Échecs d&apos;envoi
            </span>
            <strong className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
              {stats.failedCount}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Restants à traiter
            </span>
            <strong className="text-xl font-bold font-mono text-[var(--color-primary)] block mt-0.5">
              {stats.remainingCount}
            </strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--color-text)]">Progression globale de la campagne</span>
            <span className="font-mono text-[var(--color-primary)] font-bold">
              {stats.progressPercentage}% ({stats.sentCount + stats.failedCount} / {stats.totalTargets})
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--color-border)]/60 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${stats.totalTargets > 0 ? (stats.sentCount / stats.totalTargets) * 100 : 0}%` }}
              title={`Envoyés: ${stats.sentCount}`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${stats.totalTargets > 0 ? (stats.failedCount / stats.totalTargets) * 100 : 0}%` }}
              title={`Échecs: ${stats.failedCount}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Succès : {stats.sentCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Échecs : {stats.failedCount}</span>
              </span>
            </div>
            <span>Dernière exécution : {campaign.lastRunDate || "Jamais"}</span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            {campaign.status !== "COMPLETED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunBatch}
                loading={loadingAction}
                disabled={stats.remainingCount === 0}
                className="gap-1.5 font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {campaign.dispatchMode === "ALL_AT_ONCE"
                    ? "Envoyer à tous les restants maintenant"
                    : `Traiter le lot du jour (${Math.min(stats.remainingCount, campaign.dailyLimit || 100)})`}
                </span>
              </Button>
            )}

            {campaign.status === "RUNNING" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePause}
                loading={loadingAction}
                className="gap-1.5 font-semibold text-amber-700 dark:text-amber-300"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Mettre en pause</span>
              </Button>
            )}

            {campaign.status === "PAUSED" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResume}
                loading={loadingAction}
                className="gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Reprendre le job</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              loading={loadingAction}
              className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer le job</span>
            </Button>
          </div>
        </div>

        {/* Resilience Banner Note */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Règle de résilience active :</strong> Si l&apos;envoi échoue pour un client (email invalide, rejet serveur), le système enregistre l&apos;erreur et continue immédiatement le reste de la liste sans jamais planter le job.
          </span>
        </div>

        {/* Recipients List & Filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(
                [
                  { id: "ALL", label: `Tous (${recipients.length})` },
                  { id: "SENT", label: `Envoyés (${stats.sentCount})` },
                  { id: "FAILED", label: `Échecs (${stats.failedCount})` },
                  { id: "PENDING", label: `En attente (${stats.remainingCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRecipientFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    recipientFilter === tab.id
                      ? "bg-[var(--color-primary)] text-white shadow-xs font-bold"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Filtrer client ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Table / List */}
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)] max-h-[300px] overflow-y-auto">
            {filteredRecipients.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                Aucun destinataire ne correspond aux filtres actuels.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Destinataire</th>
                    <th className="p-3">Palier</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Détail / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredRecipients.map((r) => (
                    <tr key={r.customerId} className="hover:bg-[var(--color-surface-hover)]/50 transition-colors">
                      <td className="p-3">
                        <strong className="block text-[var(--color-text)] font-semibold">{r.fullName}</strong>
                        <span className="text-[11px] text-[var(--color-text-muted)]">{r.email}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                          {r.tier}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.status === "SENT" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Envoyé</span>
                          </span>
                        ) : r.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold" title={r.error}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Échec</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En attente</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-[11px] text-[var(--color-text-muted)]">
                        {r.status === "SENT" && r.sentAt
                          ? new Date(r.sentAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                          : r.status === "FAILED"
                          ? <span className="text-rose-600 font-medium truncate max-w-[150px] inline-block">{r.error || "Erreur"}</span>
                          : "Non traité"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
