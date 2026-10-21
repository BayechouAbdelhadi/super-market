"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Megaphone, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ALERT_LEVEL_STYLES, SiteAlertBanner } from "@/components/ui/SiteAlertBanner";
import { ALERTS_CONFIG, ALERT_LEVEL_DESCRIPTIONS, ALERT_LEVEL_LABELS } from "@/lib/alerts/config";
import { ALERT_LEVELS, type AlertLevel, type SiteAlert } from "@/lib/alerts/types";
import { STORE_TIME_ZONE } from "@/lib/store/config";

interface AlertsManagerProps {
  initialAlerts: SiteAlert[];
  initialTotal: number;
  loadFailed: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: STORE_TIME_ZONE,
});

/** Reads the JSON body of an API call and throws its message on failure. */
async function readResponse<T>(res: Response, fallback: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || fallback);
  return data as T;
}

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

/**
 * Admin screen for the banners shown at the top of the public site:
 * write a message, pick its level, then show, hide or delete published alerts.
 */
export function AlertsManager({ initialAlerts, initialTotal, loadFailed }: AlertsManagerProps) {
  const pageSize = ALERTS_CONFIG.listPageSize;
  const [alerts, setAlerts] = useState(initialAlerts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<AlertLevel>("INFO");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const trimmed = message.trim();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadPage = async (target: number) => {
    try {
      const res = await fetch(`/api/admin/alerts?page=${target}&limit=${pageSize}`);
      const data = await readResponse<{ alerts: SiteAlert[]; total: number; page: number }>(
        res,
        "Impossible de charger les alertes."
      );
      setAlerts(data.alerts);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de charger les alertes."));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, level }),
      });
      const data = await readResponse<{ message: string }>(res, "Erreur lors de la création de l'alerte.");
      toast.success(data.message);
      setMessage("");
      setLevel("INFO");
      await loadPage(1);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur lors de la création de l'alerte."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (alert: SiteAlert) => {
    setBusyId(alert.id);
    try {
      const res = await fetch(`/api/admin/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });
      const data = await readResponse<{ alert: SiteAlert; message: string }>(res, "Erreur de modification.");
      setAlerts((current) => current.map((a) => (a.id === data.alert.id ? data.alert : a)));
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur de modification."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (alert: SiteAlert) => {
    const confirmed = await confirm({
      title: "Supprimer cette alerte ?",
      description: "Elle disparaîtra du site et de cette liste. Cette action est définitive.",
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    setBusyId(alert.id);
    try {
      const res = await fetch(`/api/admin/alerts/${alert.id}`, { method: "DELETE" });
      const data = await readResponse<{ message: string }>(res, "Erreur de suppression.");
      toast.success(data.message);
      // Step back when the last alert of the page is gone
      await loadPage(alerts.length === 1 && page > 1 ? page - 1 : page);
    } catch (err) {
      toast.error(errorMessage(err, "Erreur de suppression."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Alertes du site</h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
          Publiez un message en bannière en haut du site public. Les alertes critiques s&apos;affichent en premier
          ; {ALERTS_CONFIG.bannerMaxCount} bannières au maximum sont visibles en même temps.
        </p>
      </div>

      {loadFailed && (
        <Alert variant="danger">
          Impossible de charger les alertes. Vérifiez que la table <code>site_alerts</code> existe dans la base.
        </Alert>
      )}

      {/* Create */}
      <Card padded="md" className="gap-6">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Nouvelle alerte</h2>
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="alert-message" className="block text-sm font-semibold text-[var(--color-text)]">
              Message
            </label>
            <textarea
              id="alert-message"
              required
              rows={3}
              maxLength={ALERTS_CONFIG.messageMaxLength}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. : Le magasin fermera exceptionnellement à 17h ce samedi."
              aria-describedby="alert-message-count"
              className="w-full min-h-[44px] rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition-all hover:border-[var(--color-border-hover)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            />
            <p id="alert-message-count" className="text-right text-xs text-[var(--color-text-muted)]">
              {message.length} / {ALERTS_CONFIG.messageMaxLength}
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-[var(--color-text)]">Niveau</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {ALERT_LEVELS.map((value) => {
                const Icon = ALERT_LEVEL_STYLES[value].icon;
                return (
                  <label
                    key={value}
                    className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-[var(--radius-button,12px)] border border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-border-hover)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary)]/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-primary)]"
                  >
                    <input
                      type="radio"
                      name="alert-level"
                      value={value}
                      checked={level === value}
                      onChange={() => setLevel(value)}
                      className="sr-only"
                    />
                    <Badge variant={ALERT_LEVEL_STYLES[value].badge} size="md" className="mt-0.5">
                      <Icon aria-hidden className="size-3.5" />
                    </Badge>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--color-text)]">
                        {ALERT_LEVEL_LABELS[value]}
                      </span>
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        {ALERT_LEVEL_DESCRIPTIONS[value]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">Aperçu</p>
            <div className="overflow-hidden rounded-[var(--radius-button,12px)] border border-[var(--color-border)]" aria-hidden>
              <SiteAlertBanner
                level={level}
                message={trimmed || "Votre message apparaîtra ici."}
                className="border-b-0"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={submitting} disabled={!trimmed} className="w-full sm:w-auto">
              {!submitting && <Megaphone aria-hidden />}
              Publier l&apos;alerte
            </Button>
          </div>
        </form>
      </Card>

      {/* List */}
      <Card padded="md" className="gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Alertes publiées</h2>
          <span className="text-sm text-[var(--color-text-muted)]">{total}</span>
        </div>

        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            Aucune alerte pour le moment. Rien n&apos;est affiché en haut du site.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ALERT_LEVEL_STYLES[alert.level].badge} size="sm">
                      {ALERT_LEVEL_LABELS[alert.level]}
                    </Badge>
                    <Badge variant={alert.isActive ? "success" : "neutral"} size="sm">
                      {alert.isActive ? "Affichée" : "Masquée"}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {dateFormatter.format(new Date(alert.createdAt))}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed break-words ${
                      alert.isActive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleToggle(alert)}
                    disabled={busyId === alert.id}
                    className="flex-1 sm:flex-none"
                  >
                    {alert.isActive ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    {alert.isActive ? "Masquer" : "Afficher"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert)}
                    disabled={busyId === alert.id}
                    aria-label="Supprimer l'alerte"
                    title="Supprimer"
                    className="hover:bg-danger-subtle hover:text-danger-text"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={loadPage}
        />
      </Card>
      {confirmDialog}
    </div>
  );
}
