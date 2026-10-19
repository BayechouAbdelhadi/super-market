import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { CampaignBusyError, processCampaignBatch } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const result = await processCampaignBatch(id);

    if (!result) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Campagne introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Lot traité : ${result.sentInBatch} envoyé(s), ${result.failedInBatch} échec(s).`,
    });
  } catch (err) {
    if (err instanceof CampaignBusyError) {
      return NextResponse.json(
        { error: "CAMPAIGN_BUSY", message: "Un envoi est déjà en cours pour cette campagne. Réessayez dans un instant." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/deals/[id]/run] Error:", err);
    return NextResponse.json(
      { error: "EXECUTION_ERROR", message: "Erreur lors de l'exécution du lot." },
      { status: 500 }
    );
  }
}
