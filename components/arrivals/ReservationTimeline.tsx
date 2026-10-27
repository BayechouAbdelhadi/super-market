import { RESERVATION_STATUS_LABELS } from "@/lib/arrivals/config";
import type { ReservationEvent, ReservationStatus } from "@/lib/arrivals/types";
import { formatDateTime } from "./format";

interface ReservationTimelineProps {
  history: ReservationEvent[];
  /** "vertical" top to bottom (customer space), "horizontal" left to right (checkout). */
  orientation?: "vertical" | "horizontal";
}

/** Dot and label colors of each step; a cancellation shows in red. */
const STEP_TONES: Record<ReservationStatus, { dot: string; text: string }> = {
  CONFIRMED: { dot: "bg-info ring-info-subtle", text: "text-info-text" },
  REMINDED: { dot: "bg-warning ring-warning-subtle", text: "text-warning-text" },
  COLLECTED: { dot: "bg-success ring-success-subtle", text: "text-success-text" },
  CANCELLED: { dot: "bg-danger ring-danger-subtle", text: "text-danger-text" },
  NO_SHOW: { dot: "bg-danger ring-danger-subtle", text: "text-danger-text" },
};

/**
 * Status changes of a reservation as dots on a line, oldest first; the last dot is the current status.
 * Hidden while the reservation has only its first status.
 */
export function ReservationTimeline({ history, orientation = "vertical" }: ReservationTimelineProps) {
  if (history.length < 2) return null;
  const horizontal = orientation === "horizontal";
  return (
    <ol aria-label="Historique de la réservation" className={horizontal ? "flex" : "space-y-5"}>
      {history.map((event, index) => {
        const isLast = index === history.length - 1;
        const tone = STEP_TONES[event.status];
        return (
          <li
            key={`${event.status}-${event.at}`}
            aria-current={isLast ? "step" : undefined}
            className={horizontal ? "relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center" : "relative flex gap-3"}
          >
            {!isLast && (
              <span
                aria-hidden
                className={
                  horizontal
                    ? "absolute left-1/2 top-[7px] h-0.5 w-full bg-border"
                    : "absolute left-[7px] top-4 -bottom-5 w-0.5 bg-border"
                }
              />
            )}
            <span
              aria-hidden
              className={`relative mt-0.5 size-3 shrink-0 rounded-full ${tone.dot} ${isLast ? "ring-4" : ""} ${
                horizontal ? "" : "ml-0.5"
              }`}
            />
            <div className="min-w-0 space-y-0.5 px-1">
              <p className={`text-sm ${tone.text} ${isLast ? "font-semibold" : ""}`}>
                {RESERVATION_STATUS_LABELS[event.status]}
              </p>
              <p className="text-xs text-text-muted">{formatDateTime(event.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
