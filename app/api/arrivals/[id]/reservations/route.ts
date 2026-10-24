import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ArrivalIdSchema, CreateReservationSchema } from "@/lib/arrivals/validation";
import { reserve } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** A signed-in customer reserves products of an open arrival. */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["CUSTOMER"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsCustomerEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  const parsed = CreateReservationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Réservation invalide.");

  try {
    const reservation = await reserve(id.data, auth.user.id, parsed.data, auth.user.email ?? null);
    return NextResponse.json({ success: true, reservation, message: "Réservation confirmée." }, { status: 201 });
  } catch (err) {
    return arrivalErrorResponse(
      err,
      "POST /api/arrivals/[id]/reservations",
      "RESERVATION_FAILED",
      "Erreur lors de la réservation. Veuillez réessayer."
    );
  }
}
