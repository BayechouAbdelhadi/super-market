import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { readCustomerId } from "@/lib/loyalty/route-params";
import { getActiveReservationForCustomer } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse } from "@/lib/arrivals/api-errors";
import { isArrivalsCustomerEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** The customer's latest reservation still waiting for pickup (null when none), shown at the checkout. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN", "CASHIER"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsCustomerEnabled()) return featureDisabledResponse();

  const { id, response } = await readCustomerId(params);
  if (response) return response;

  try {
    const reservation = await getActiveReservationForCustomer(id);
    return NextResponse.json({ reservation });
  } catch (err) {
    return arrivalErrorResponse(
      err,
      "GET /api/loyalty/customers/[id]/reservation",
      "FETCH_FAILED",
      "Impossible de récupérer la réservation du client."
    );
  }
}
