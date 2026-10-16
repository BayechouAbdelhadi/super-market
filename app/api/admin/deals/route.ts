import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { CreateCampaignSchema } from "@/lib/marketing/validation";
import {
  createMarketingCampaign,
  triggerDueCampaigns,
} from "@/lib/marketing/service";
import { defaultMarketingRepo } from "@/lib/marketing/adapters/supabase-marketing-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    // Automatically trigger any campaigns due as of current Paris time
    try {
      await triggerDueCampaigns();
    } catch (triggerErr) {
      console.warn("[GET /api/admin/deals] Auto-trigger due campaigns warning:", triggerErr);
    }

    const campaigns = await defaultMarketingRepo.getAll();

    // Summary statistics
    const totalCampaigns = campaigns.length;
    const activeJobs = campaigns.filter(
      (c) => c.status === "RUNNING" || c.status === "SCHEDULED"
    ).length;
    const totalEmailsSent = campaigns.reduce((acc, c) => acc + (c.stats.sentCount || 0), 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + (c.stats.failedCount || 0), 0);

    return NextResponse.json({
      campaigns,
      summary: {
        totalCampaigns,
        activeJobs,
        totalEmailsSent,
        totalFailed,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/deals] Error:", err);
    return NextResponse.json(
      { error: "FETCH_FAILED", message: "Impossible de récupérer les campagnes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: issue?.message || "Données de campagne invalides.",
          field: issue?.path[0],
        },
        { status: 400 }
      );
    }

    const campaign = await createMarketingCampaign(parsed.data, auth.user.email);
    const isDraft = campaign.status === "DRAFT";

    return NextResponse.json(
      {
        success: true,
        campaign,
        message: isDraft
          ? `Brouillon « ${campaign.title} » sauvegardé avec succès.`
          : `Campagne « ${campaign.title} » programmée avec ${campaign.stats.totalTargets} client(s) ciblé(s).`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/admin/deals] Error:", err);
    return NextResponse.json(
      { error: "CREATION_FAILED", message: err?.message || "Erreur lors de la création de la campagne." },
      { status: 500 }
    );
  }
}
