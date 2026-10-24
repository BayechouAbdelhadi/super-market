import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { ArrivalSchema } from "@/lib/arrivals/validation";
import { createArrival, listArrivals } from "@/lib/arrivals/service";
import { arrivalErrorResponse, featureDisabledResponse, validationError } from "@/lib/arrivals/api-errors";
import { isArrivalsAdminEnabled } from "@/lib/arrivals/flags";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const pageParams = parsePageParams(req.nextUrl.searchParams, ARRIVALS_CONFIG.listPageSize, ARRIVALS_CONFIG.listMaxPageSize) ?? {
    page: 1,
    limit: ARRIVALS_CONFIG.listPageSize,
    offset: 0,
  };

  try {
    const { items, total } = await listArrivals(pageParams.offset, pageParams.limit);
    return NextResponse.json({ arrivals: items, total, page: pageParams.page, limit: pageParams.limit });
  } catch (err) {
    return arrivalErrorResponse(err, "GET /api/admin/arrivals", "FETCH_FAILED", "Impossible de récupérer les arrivages.");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;
  if (!isArrivalsAdminEnabled()) return featureDisabledResponse();

  const parsed = ArrivalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Arrivage invalide.");

  try {
    const arrival = await createArrival(parsed.data, auth.user.email ?? null);
    return NextResponse.json({ success: true, arrival, message: "Arrivage créé." }, { status: 201 });
  } catch (err) {
    return arrivalErrorResponse(err, "POST /api/admin/arrivals", "CREATION_FAILED", "Erreur lors de la création de l'arrivage.");
  }
}
