import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { RESERVATION_STATUS_LABELS } from "@/lib/arrivals/config";
import { ReservationIdSchema, UpdateReservationStatusSchema } from "@/lib/arrivals/validation";
import { setReservationStatus } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Cashier or admin: collected, reminded, missed or cancelled. */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN", "CASHIER"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsCustomerEnabled()) return featureDisabledResponse();

  const id = ReservationIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant de réservation invalide.");

  const parsed = UpdateReservationStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Statut invalide.");

  try {
    const reservation = await setReservationStatus(id.data, parsed.data.status, auth.user.email ?? null);
    return NextResponse.json({
      success: true,
      reservation,
      message: `Réservation : ${RESERVATION_STATUS_LABELS[reservation.status]}.`,
    });
  } catch (err) {
    return arrivalErrorResponse(err, "PATCH /api/loyalty/reservations/[id]", "UPDATE_FAILED", "Erreur lors du changement de statut.");
  }
}
