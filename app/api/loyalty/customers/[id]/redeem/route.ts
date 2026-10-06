import { NextRequest, NextResponse } from "next/server";
import { redeemPoints } from "@/lib/loyalty/service";
import { supabase } from "@/lib/supabase/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    
    const { data: cashiers } = await supabase.from("profiles").select("id").eq("role", "CASHIER").limit(1);
    const cashierId = cashiers?.[0]?.id || null;

    const points = Number(body.points);
    const reason = typeof body.reason === "string" ? body.reason : undefined;

    const result = await redeemPoints(id, points, cashierId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "REDEEM_ERROR",
          message: result.error,
          availablePoints: result.availablePoints,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Points déduits avec succès.",
        movement: result.movement,
        customer: result.customer,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Erreur lors de la déduction des points.",
      },
      { status: 500 },
    );
  }
}
