import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { defaultMarketingRepo } from "@/lib/marketing/adapters/supabase-marketing-repository";
import { deleteCampaign } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const campaign = await defaultMarketingRepo.getById(id);

  if (!campaign) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Campagne introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ campaign });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const deleted = await deleteCampaign(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Campagne introuvable ou déjà supprimée." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Campagne supprimée avec succès.",
  });
}
