import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { listCustomerReservations } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse } from "@/lib/arrivals/api-errors";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

/** The signed-in customer's own reservations, newest first. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(["CUSTOMER"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsCustomerEnabled()) return featureDisabledResponse();

  const pageParams = parsePageParams(
    req.nextUrl.searchParams,
    ARRIVALS_CONFIG.customerReservationsPageSize,
    ARRIVALS_CONFIG.customerReservationsMaxPageSize
  ) ?? { page: 1, limit: ARRIVALS_CONFIG.customerReservationsPageSize, offset: 0 };

  try {
    const { items, total } = await listCustomerReservations(auth.user.id, pageParams.offset, pageParams.limit);
    return NextResponse.json({ reservations: items, total, page: pageParams.page, limit: pageParams.limit });
  } catch (err) {
    return arrivalErrorResponse(err, "GET /api/account/reservations", "FETCH_FAILED", "Impossible de récupérer vos réservations.");
  }
}
