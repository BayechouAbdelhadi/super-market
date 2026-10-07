import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";

export async function GET() {
  try {
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
