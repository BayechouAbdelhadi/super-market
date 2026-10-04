import { NextRequest, NextResponse } from "next/server";
import { redeemPoints } from "@/lib/loyalty/service";
import { loyaltyStore } from "@/lib/loyalty/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const cashier = loyaltyStore.getCashier();

    const points = Number(body.points);
    const reason = typeof body.reason === "string" ? body.reason : undefined;

    const result = redeemPoints(id, points, cashier.id, reason);

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
