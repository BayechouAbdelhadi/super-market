import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { requireAuth } from "@/lib/loyalty/api-auth";

export async function GET() {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const data = await getDashboardAnalytics();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Analytics GET] Error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du tableau de bord." },
      { status: 500 }
    );
  }
}
