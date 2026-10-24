import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { ArrivalIdSchema, ArrivalSchema } from "@/lib/arrivals/validation";
import { deleteArrival, getArrival, getArrivalStats, updateArrival } from "@/lib/arrivals/service";
import { ARRIVAL_NOT_FOUND_BODY, arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  try {
    const arrival = await getArrival(id.data);
    if (!arrival) return NextResponse.json(ARRIVAL_NOT_FOUND_BODY, { status: 404 });
    const stats = await getArrivalStats(id.data);
    return NextResponse.json({ arrival, stats });
  } catch (err) {
    return arrivalErrorResponse(err, "GET /api/admin/arrivals/[id]", "FETCH_FAILED", "Impossible de récupérer l'arrivage.");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  const parsed = ArrivalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Arrivage invalide.");

  try {
    const arrival = await updateArrival(id.data, parsed.data);
    if (!arrival) return NextResponse.json(ARRIVAL_NOT_FOUND_BODY, { status: 404 });
    return NextResponse.json({ success: true, arrival, message: "Arrivage modifié." });
  } catch (err) {
    return arrivalErrorResponse(err, "PATCH /api/admin/arrivals/[id]", "UPDATE_FAILED", "Erreur lors de la modification de l'arrivage.");
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  try {
    const deleted = await deleteArrival(id.data);
    if (!deleted) return NextResponse.json(ARRIVAL_NOT_FOUND_BODY, { status: 404 });
    return NextResponse.json({ success: true, message: "Arrivage supprimé." });
  } catch (err) {
    return arrivalErrorResponse(err, "DELETE /api/admin/arrivals/[id]", "DELETE_FAILED", "Erreur lors de la suppression de l'arrivage.");
  }
}
