"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { formatDay } from "@/components/arrivals/format";
import { ARRIVALS_CONFIG, ARRIVAL_PHASE_LABELS } from "@/lib/arrivals/config";
import { getArrivalPhase } from "@/lib/arrivals/domain";
import type { Arrival, ArrivalPhase } from "@/lib/arrivals/types";
import { ArrivalForm } from "./ArrivalForm";

interface ArrivalsManagerProps {
  initialArrivals: Arrival[];
  initialTotal: number;
  loadFailed: boolean;
}

export const PHASE_BADGES: Record<ArrivalPhase, "warning" | "success" | "neutral" | "info"> = {
  SCHEDULED: "info",
  OPEN: "success",
  CLOSED: "warning",
  FINISHED: "neutral",
};

/** Admin list of the arrivals, newest first, with the creation form. */
export function ArrivalsManager({ initialArrivals, initialTotal, loadFailed }: ArrivalsManagerProps) {
  const router = useRouter();
  const pageSize = ARRIVALS_CONFIG.listPageSize;
  const [arrivals, setArrivals] = useState(initialArrivals);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const loadPage = async (target: number) => {
    try {
      const res = await fetch(`/api/admin/arrivals?page=${target}&limit=${pageSize}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      setArrivals(data.arrivals);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Impossible de charger les arrivages.");
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Arrivages</h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Proposez un arrivage à la réservation. Il s&apos;affiche sur la page d&apos;accueil jusqu&apos;à la clôture
            des réservations ; les clients récupèrent et paient en magasin le jour de l&apos;arrivage.
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="shrink-0">
            <Plus aria-hidden />
            Nouvel arrivage
          </Button>
        )}
      </div>

      {loadFailed && (
        <Alert variant="danger">
          Impossible de charger les arrivages. Vérifiez que le script <code>supabase/arrivals.sql</code> a été appliqué.
        </Alert>
      )}

      {creating && (
        <Card padded="md" className="gap-6">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Nouvel arrivage</h2>
          <ArrivalForm
            onCancel={() => setCreating(false)}
            onSaved={(arrival) => router.push(`/admin/arrivals/${arrival.id}`)}
          />
        </Card>
      )}

      <Card padded="md" className="gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Tous les arrivages</h2>
          <span className="text-sm text-[var(--color-text-muted)]">{total}</span>
        </div>

        {arrivals.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Aucun arrivage pour le moment.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {arrivals.map((arrival) => {
              const phase = getArrivalPhase(arrival, now);
              const reserved = arrival.items.reduce((sum, i) => sum + i.stockReserved, 0);
              const stock = arrival.items.reduce((sum, i) => sum + i.stockTotal, 0);
              return (
                <li key={arrival.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--color-text)]">{arrival.title}</p>
                      <Badge variant={PHASE_BADGES[phase]} size="sm">
                        {ARRIVAL_PHASE_LABELS[phase]}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Retrait le {formatDay(arrival.pickupDate)} · {reserved} / {stock} réservé(s)
                    </p>
                  </div>
                  <Link
                    href={`/admin/arrivals/${arrival.id}`}
                    className={buttonVariants({ variant: "secondary", className: "shrink-0" })}
                  >
                    Gérer
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / pageSize))}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={loadPage}
        />
      </Card>
    </div>
  );
}
