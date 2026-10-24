import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ArrivalIdSchema } from "@/lib/arrivals/validation";
import { closeArrival } from "@/lib/arrivals/service";
import { ARRIVAL_NOT_FOUND_BODY, arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Closes reservations now, before the planned end. */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  try {
    const arrival = await closeArrival(id.data);
    if (!arrival) return NextResponse.json(ARRIVAL_NOT_FOUND_BODY, { status: 404 });
    return NextResponse.json({ success: true, arrival, message: "Réservations clôturées." });
  } catch (err) {
    return arrivalErrorResponse(err, "POST /api/admin/arrivals/[id]/close", "CLOSE_FAILED", "Erreur lors de la clôture de l'arrivage.");
  }
}
