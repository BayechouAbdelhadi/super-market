import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { countAudienceByTier } from "@/lib/marketing/service";

export const dynamic = "force-dynamic";

/** How many customers each loyalty tier would email: the campaign editor sums the selected tiers. */
export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const byTier = await countAudienceByTier();
    return NextResponse.json({ byTier });
  } catch (err) {
    console.error("[GET /api/admin/deals/audience] Error:", err);
    return NextResponse.json(
      { error: "COUNT_FAILED", message: "Impossible de calculer le nombre de clients." },
      { status: 500 }
    );
  }
}
