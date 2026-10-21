import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { ALERTS_CONFIG } from "@/lib/alerts/config";
import { CreateAlertSchema } from "@/lib/alerts/validation";
import { createAlert, listAlerts } from "@/lib/alerts/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const pageParams = parsePageParams(req.nextUrl.searchParams, ALERTS_CONFIG.listPageSize, ALERTS_CONFIG.listMaxPageSize) ?? {
    page: 1,
    limit: ALERTS_CONFIG.listPageSize,
    offset: 0,
  };

  try {
    const { items, total } = await listAlerts(pageParams.offset, pageParams.limit);
    return NextResponse.json({ alerts: items, total, page: pageParams.page, limit: pageParams.limit });
  } catch (err) {
    console.error("[GET /api/admin/alerts] Error:", err);
    return NextResponse.json(
      { error: "FETCH_FAILED", message: "Impossible de récupérer les alertes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: issue?.message || "Alerte invalide.", field: issue?.path[0] },
      { status: 400 }
    );
  }

  try {
    const alert = await createAlert(parsed.data, auth.user.email ?? null);
    return NextResponse.json({ success: true, alert, message: "Alerte publiée sur le site." }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/alerts] Error:", err);
    return NextResponse.json(
      { error: "CREATION_FAILED", message: "Erreur lors de la création de l'alerte." },
      { status: 500 }
    );
  }
}
