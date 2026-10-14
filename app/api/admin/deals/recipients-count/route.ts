import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { getTargetCustomersByTiers } from "@/lib/marketing/service";
import { LoyaltyTier } from "@/lib/loyalty/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const { tiers } = await req.json();
    if (!Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json({ count: 0, customers: [] });
    }

    const recipients = await getTargetCustomersByTiers(tiers as LoyaltyTier[]);

    return NextResponse.json({
      count: recipients.length,
      sample: recipients.slice(0, 5).map((r) => ({
        fullName: r.fullName,
        email: r.email,
        tier: r.tier,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "COUNT_FAILED", message: "Impossible de calculer le nombre de clients." },
      { status: 500 }
    );
  }
}
