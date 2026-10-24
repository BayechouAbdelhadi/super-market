import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ReservationIdSchema } from "@/lib/arrivals/validation";
import { cancelOwnReservation } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** The customer cancels their own reservation while the arrival is still open. */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["CUSTOMER"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsCustomerEnabled()) return featureDisabledResponse();

  const id = ReservationIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant de réservation invalide.");

  try {
    await cancelOwnReservation(id.data, auth.user.id, auth.user.email ?? null);
    return NextResponse.json({ success: true, message: "Réservation annulée." });
  } catch (err) {
    return arrivalErrorResponse(err, "DELETE /api/account/reservations/[id]", "CANCEL_FAILED", "Erreur lors de l'annulation.");
  }
}
