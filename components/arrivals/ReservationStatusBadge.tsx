import { Badge, type BadgeProps } from "@/components/ui/badge";
import { RESERVATION_STATUS_LABELS } from "@/lib/arrivals/config";
import type { ReservationStatus } from "@/lib/arrivals/types";

const VARIANTS: Record<ReservationStatus, NonNullable<BadgeProps["variant"]>> = {
  CONFIRMED: "info",
  REMINDED: "warning",
  COLLECTED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "danger",
};

/** Status of a reservation, styled from the theme. */
export function ReservationStatusBadge({ status, size = "md" }: { status: ReservationStatus; size?: BadgeProps["size"] }) {
  return (
    <Badge variant={VARIANTS[status]} size={size}>
      {RESERVATION_STATUS_LABELS[status]}
    </Badge>
  );
}
