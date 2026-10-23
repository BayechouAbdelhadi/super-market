"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { MarketingCampaign } from "@/lib/marketing/types";
import { toast } from "@/components/ui/sonner";
import { renderDealEmailHtml } from "@/lib/marketing/templates/deal-email";
import { EmailVisualizerModal } from "./EmailVisualizerModal";
import {
  Play,
  Pause,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Eye,
} from "lucide-react";
import { getSiteUrl } from "@/lib/utils/app-url";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

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
  const [activeTab, setActiveTab] = useState<"overview" | "preview">("overview");
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<"ALL" | "SENT" | "FAILED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirm, confirmDialog] = useConfirm();

  const recipients = campaign?.recipients || [];

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

  const {
    paginatedItems: paginatedRecipients,
    page: recipientsPage,
    pageSize: recipientsPageSize,
    totalPages: recipientsTotalPages,
    totalItems: recipientsTotalItems,
    setPage: setRecipientsPage,
    setPageSize: setRecipientsPageSize,
  } = usePagination(filteredRecipients, { defaultPageSize: LOYALTY_CONFIG.pagination.defaultPageSize });

  if (!isOpen || !campaign) return null;

  const stats = campaign.stats || {
    totalTargets: 0,
    sentCount: 0,
    failedCount: 0,
    remainingCount: 0,
    progressPercentage: 0,
  };

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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'exécution.");
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'action.");
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur d'action.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Supprimer cette campagne ?",
      description: `La campagne « ${campaign?.title} » et son suivi d'envoi seront supprimés. Cette action est définitive.`,
      confirmLabel: "Supprimer la campagne",
    });
    if (!confirmed) return;
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
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur de suppression.");
    } finally {
      setLoadingAction(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success-subtle text-success-text border border-success-border">Terminé</span>;
      case "RUNNING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info-subtle text-info-text border border-info-border animate-pulse">En cours</span>;
      case "PAUSED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning-subtle text-warning-text border border-warning-border">En pause</span>;
      case "SCHEDULED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-highlight-subtle text-highlight-text border border-highlight-border">Programmé</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-hover text-text border border-border">Brouillon</span>;
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
            Du {campaign.startDate} au {campaign.endDate} (🌙 Minuit · {campaign.scheduledTime || "00:00"})
          </span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
        {/* Top View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--color-border)] pb-3">
          <div className="inline-flex p-1 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Destinataires</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "preview"
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu email</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisualizerOpen(true)}
              className="gap-1.5 text-xs font-bold text-info-text border-info-border bg-info-subtle hover:bg-info-subtle w-full sm:w-auto justify-center"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vue smartphone</span>
            </Button>
            <div className="text-xs text-[var(--color-text-muted)] font-mono hidden md:block">
              ID: {campaign.id.slice(0, 8)}...
            </div>
          </div>
        </div>

        {activeTab === "preview" ? (
          /* Email Preview Tab */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between text-xs">
              <div>
                <strong className="block text-[var(--color-text)]">Objet : {campaign.subject}</strong>
                <span className="text-[var(--color-text-muted)]">
                  Bannière : {campaign.imageUrl ? "Personnalisée intégrée" : "Standard"} · Cible : {campaign.targetTiers.join(", ")}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-surface-hover shadow-inner flex justify-center p-3 sm:p-5">
              <iframe
                title="Aperçu de la newsletter"
                // Email preview: no scripts, links open in a new tab
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={renderDealEmailHtml({
                  customerName: "Marie Dupont",
                  tier: campaign.targetTiers[0] || "GOLD",
                  subject: campaign.subject,
                  content: campaign.content,
                  imageUrl: campaign.imageUrl,
                  ctaText: campaign.ctaText || "Découvrir les offres en magasin",
                  ctaUrl: campaign.ctaUrl || getSiteUrl(),
                  storeName: "Super Market Calais",
                  storeAddress: "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
                  storePhone: "06 71 54 05 28",
                })}
                className="w-full max-w-[620px] h-[550px] rounded-xl border border-[var(--color-border)] shadow-lg bg-surface"
              />
            </div>
          </div>
        ) : (
          /* Overview Tab */
          <div className="space-y-5 animate-in fade-in duration-200">
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

          <div className="p-3.5 rounded-xl bg-success-subtle border border-success-border shadow-xs">
            <span className="text-[11px] font-semibold text-success-text uppercase tracking-wider block">
              Envoyés avec succès
            </span>
            <strong className="text-xl font-bold font-mono text-success-text block mt-0.5">
              {stats.sentCount}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-danger-subtle border border-danger-border shadow-xs">
            <span className="text-[11px] font-semibold text-danger-text uppercase tracking-wider block">
              Échecs d&apos;envoi
            </span>
            <strong className="text-xl font-bold font-mono text-danger-text block mt-0.5">
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
              className="bg-success h-full transition-all duration-500"
              style={{ width: `${stats.totalTargets > 0 ? (stats.sentCount / stats.totalTargets) * 100 : 0}%` }}
              title={`Envoyés: ${stats.sentCount}`}
            />
            <div
              className="bg-danger h-full transition-all duration-500"
              style={{ width: `${stats.totalTargets > 0 ? (stats.failedCount / stats.totalTargets) * 100 : 0}%` }}
              title={`Échecs: ${stats.failedCount}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>Succès : {stats.sentCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span>Échecs : {stats.failedCount}</span>
              </span>
            </div>
            <span>Dernière exécution : {campaign.lastRunDate || "Jamais"}</span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {campaign.status !== "COMPLETED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunBatch}
                loading={loadingAction}
                disabled={stats.remainingCount === 0}
                className="gap-1.5 font-bold w-full sm:w-auto justify-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {campaign.dispatchMode === "ALL_AT_ONCE"
                    ? "Envoyer aux restants"
                    : `Traiter le lot (${Math.min(stats.remainingCount, campaign.dailyLimit || 100)})`}
                </span>
              </Button>
            )}

            {campaign.status === "RUNNING" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePause}
                loading={loadingAction}
                className="gap-1.5 font-semibold text-warning-text w-full sm:w-auto justify-center"
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
                className="gap-1.5 font-semibold text-success-text w-full sm:w-auto justify-center"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Reprendre le job</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              loading={loadingAction}
              className="gap-1.5 text-danger-text hover:text-danger-text hover:bg-danger-subtle text-xs font-semibold w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer le job</span>
            </Button>
          </div>
        </div>

        {/* Resilience Banner Note */}
        <div className="p-3 rounded-lg bg-success-subtle border border-success-border text-xs text-success-text flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
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
                  onClick={() => {
                    setRecipientFilter(tab.id);
                    setRecipientsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    recipientFilter === tab.id
                      ? "bg-[var(--color-primary)] text-on-color shadow-xs font-bold"
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setRecipientsPage(1);
                }}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Table / List */}
          <div className="border border-[var(--color-border)] rounded-xl overflow-x-auto bg-[var(--color-surface)] max-h-[300px] overflow-y-auto">
            {filteredRecipients.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                Aucun destinataire ne correspond aux filtres actuels.
              </div>
            ) : (
              <table className="w-full min-w-[500px] text-xs text-left">
                <thead className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Destinataire</th>
                    <th className="p-3">Palier</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Détail / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {paginatedRecipients.map((r) => (
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
                          <span className="inline-flex items-center gap-1 text-success-text font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Envoyé</span>
                          </span>
                        ) : r.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 text-danger-text font-semibold" title={r.error}>
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
                          ? <span className="text-danger-text font-medium truncate max-w-[150px] inline-block">{r.error || "Erreur"}</span>
                          : "Non traité"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredRecipients.length > 0 && (
            <Pagination
              page={recipientsPage}
              totalPages={recipientsTotalPages}
              totalItems={recipientsTotalItems}
              pageSize={recipientsPageSize}
              onPageChange={setRecipientsPage}
              onPageSizeChange={setRecipientsPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </div>
      </div>
    )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Standalone Responsive Consumer Email Visualizer */}
      <EmailVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
        title={campaign.title}
        subject={campaign.subject}
        content={campaign.content}
        imageUrl={campaign.imageUrl}
        ctaText={campaign.ctaText || "Découvrir les offres en magasin"}
        ctaUrl={campaign.ctaUrl || getSiteUrl()}
        targetTiers={campaign.targetTiers}
      />
      {confirmDialog}
    </Modal>
  );
}
