import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { resumeCampaign } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  try {
    const campaign = await resumeCampaign(id);

    if (!campaign) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Campagne introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campagne reprise avec succès.",
    });
  } catch (err) {
    console.error("[POST /api/admin/deals/[id]/resume] Error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur lors de l'accès à la campagne." },
      { status: 500 }
    );
  }
}
