"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ReservationActions } from "@/components/arrivals/ReservationActions";
import { ReservationStatusBadge } from "@/components/arrivals/ReservationStatusBadge";
import { formatDateTime, formatDay, formatEuro } from "@/components/arrivals/format";
import { ARRIVALS_CONFIG, ARRIVAL_PHASE_LABELS, RESERVATION_STATUS_LABELS } from "@/lib/arrivals/config";
import { getArrivalPhase } from "@/lib/arrivals/domain";
import {
  RESERVATION_STATUSES,
  type Arrival,
  type ArrivalStats,
  type Reservation,
  type ReservationStatus,
} from "@/lib/arrivals/types";
import { ArrivalForm } from "./ArrivalForm";
import { PHASE_BADGES } from "./ArrivalsManager";

interface ArrivalDetailProps {
  arrival: Arrival;
  stats: ArrivalStats;
  initialReservations: Reservation[];
  initialTotal: number;
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

/** One arrival for the admin: figures, edit, close, delete, and its reservations with their status actions. */
export function ArrivalDetail({ arrival, stats, initialReservations, initialTotal }: ArrivalDetailProps) {
  const router = useRouter();
  const pageSize = ARRIVALS_CONFIG.reservationsPageSize;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reservations, setReservations] = useState(initialReservations);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReservationStatus | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const phase = getArrivalPhase(arrival, new Date());
  const canClose = phase === "SCHEDULED" || phase === "OPEN";

  const loadReservations = async (target: number, filter: ReservationStatus | null) => {
    try {
      const query = new URLSearchParams({ page: String(target), limit: String(pageSize) });
      if (filter) query.set("status", filter);
      const res = await fetch(`/api/admin/arrivals/${arrival.id}/reservations?${query}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      setReservations(data.reservations);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Impossible de charger les réservations.");
    }
  };

  const changeFilter = (filter: ReservationStatus | null) => {
    setStatus(filter);
    loadReservations(1, filter);
  };

  const runAction = async (url: string, method: "POST" | "DELETE", onSuccess: () => void) => {
    setBusy(true);
    try {
      const res = await fetch(url, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      onSuccess();
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "L'opération a échoué.");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    const confirmed = await confirm({
      title: "Clôturer les réservations ?",
      description: "Plus aucun client ne pourra réserver. Les réservations déjà faites sont conservées.",
      confirmLabel: "Clôturer",
    });
    if (confirmed) runAction(`/api/admin/arrivals/${arrival.id}/close`, "POST", () => router.refresh());
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Supprimer cet arrivage ?",
      description: "L'arrivage, ses articles et l'historique de ses réservations seront supprimés. Cette action est définitive.",
      confirmLabel: "Supprimer",
    });
    if (confirmed) runAction(`/api/admin/arrivals/${arrival.id}`, "DELETE", () => router.push("/admin/arrivals"));
  };

  const handleReservationChanged = (updated: Reservation) => {
    setReservations((current) => current.map((r) => (r.id === updated.id ? updated : r)));
    // Figures and stock come from the server
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/arrivals"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Tous les arrivages
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">{arrival.title}</h1>
            <Badge variant={PHASE_BADGES[phase]} size="md">
              {ARRIVAL_PHASE_LABELS[phase]}
            </Badge>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Réservations du {formatDateTime(arrival.reservationOpensAt)} au {formatDateTime(arrival.reservationClosesAt)}
            {arrival.closedAt && ` · clôturé le ${formatDateTime(arrival.closedAt)}`} · retrait le{" "}
            {formatDay(arrival.pickupDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing((v) => !v)} disabled={busy}>
            <Pencil aria-hidden />
            {editing ? "Fermer" : "Modifier"}
          </Button>
          {canClose && (
            <Button variant="secondary" onClick={handleClose} disabled={busy}>
              <Lock aria-hidden />
              Clôturer
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            <Trash2 aria-hidden />
            Supprimer
          </Button>
        </div>
      </div>

      {editing && (
        <Card padded="md" className="gap-6">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Modifier l&apos;arrivage</h2>
          <ArrivalForm
            arrival={arrival}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </Card>
      )}

      {/* Figures */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Réservations" value={stats.totalReservations} description={`${stats.customers} client(s) · ${stats.byStatus.CANCELLED} annulée(s)`} />
        <StatCard label="Montant réservé" value={formatEuro(stats.expectedRevenue)} description="Réservations non annulées ni manquées" accent="brand" />
        <StatCard label="Montant encaissé" value={formatEuro(stats.collectedRevenue)} description="Réservations récupérées" />
        <StatCard
          label="Taux de récupération"
          value={stats.collectionRate === null ? "—" : percent(stats.collectionRate)}
          description={`${stats.byStatus.COLLECTED} récupérée(s) · ${stats.byStatus.NO_SHOW} non récupérée(s)`}
        />
        <StatCard
          label="Panier moyen"
          value={stats.averageBasket === null ? "—" : formatEuro(stats.averageBasket)}
          description="Par réservation"
        />
        <StatCard
          label="À remettre"
          value={stats.byStatus.CONFIRMED + stats.byStatus.REMINDED}
          description={`${stats.byStatus.REMINDED} client(s) relancé(s)`}
        />
      </div>

      <Card padded="md" className="gap-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Par article</h2>
        <ul className="space-y-4">
          {stats.items.map((item) => {
            const ratio = item.stockTotal > 0 ? item.stockReserved / item.stockTotal : 0;
            return (
              <li key={item.itemId} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold text-[var(--color-text)]">
                    {item.name} <span className="font-normal text-[var(--color-text-muted)]">· {item.unitLabel}</span>
                  </span>
                  <span className="tabular-nums text-[var(--color-text-muted)]">
                    {item.stockReserved} / {item.stockTotal} réservé(s) ({percent(ratio)}) · {item.collectedQuantity}{" "}
                    récupéré(s) · {Math.max(0, item.stockTotal - item.stockReserved)} restant(s)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]" aria-hidden>
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        {stats.daily.length > 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Réservations par jour :{" "}
            {stats.daily.map((d) => `${formatDay(d.day)} (${d.count})`).join(" · ")}
          </p>
        )}
      </Card>

      {/* Reservations */}
      <Card padded="md" className="gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Réservations</h2>
          <span className="text-sm text-[var(--color-text-muted)]">{total}</span>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {[null, ...RESERVATION_STATUSES].map((value) => (
            <Button
              key={value ?? "ALL"}
              size="sm"
              variant={status === value ? "primary" : "secondary"}
              aria-pressed={status === value}
              onClick={() => changeFilter(value)}
            >
              {value ? `${RESERVATION_STATUS_LABELS[value]} (${stats.byStatus[value]})` : "Toutes"}
            </Button>
          ))}
        </div>

        {reservations.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Aucune réservation.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--color-text)]">{reservation.customer.fullName}</p>
                    <ReservationStatusBadge status={reservation.status} size="sm" />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {[reservation.customer.phone, reservation.customer.email].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    {reservation.lines.map((l) => `${l.quantity} × ${l.itemName}`).join(", ")} ·{" "}
                    <strong className="font-semibold">{formatEuro(reservation.totalAmount)}</strong>
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Réservée le {formatDateTime(reservation.createdAt)}</p>
                </div>
                <ReservationActions reservation={reservation} onChanged={handleReservationChanged} compact />
              </li>
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / pageSize))}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={(target) => loadReservations(target, status)}
        />
      </Card>
      {confirmDialog}
    </div>
  );
}
