import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { ArrivalIdSchema, ReservationStatusFilterSchema } from "@/lib/arrivals/validation";
import { listArrivalReservations } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const id = ArrivalIdSchema.safeParse((await params).id);
  if (!id.success) return validationError(id.error, "Identifiant d'arrivage invalide.");

  const search = req.nextUrl.searchParams;
  const status = ReservationStatusFilterSchema.parse(search.get("status"));
  const pageParams = parsePageParams(search, ARRIVALS_CONFIG.reservationsPageSize, ARRIVALS_CONFIG.reservationsMaxPageSize) ?? {
    page: 1,
    limit: ARRIVALS_CONFIG.reservationsPageSize,
    offset: 0,
  };

  try {
    const { items, total } = await listArrivalReservations(id.data, status, pageParams.offset, pageParams.limit);
    return NextResponse.json({ reservations: items, total, page: pageParams.page, limit: pageParams.limit });
  } catch (err) {
    return arrivalErrorResponse(
      err,
      "GET /api/admin/arrivals/[id]/reservations",
      "FETCH_FAILED",
      "Impossible de récupérer les réservations."
    );
  }
}
