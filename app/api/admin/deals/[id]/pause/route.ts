import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { pauseCampaign } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const campaign = await pauseCampaign(id);

  if (!campaign) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Campagne introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    campaign,
    message: "Campagne mise en pause avec succès.",
  });
}
