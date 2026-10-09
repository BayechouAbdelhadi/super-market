import { NextRequest, NextResponse } from "next/server";
import { redeemPoints } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { RedeemPointsSchema } from "@/lib/loyalty/validation";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(["CASHIER", "ADMIN"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await req.json();

    const validation = RedeemPointsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Données d'utilisation de points invalides.",
        },
        { status: 400 }
      );
    }

    const { points, amount, reason } = validation.data;
    const cashierId = auth.user.id;

    const result = await redeemPoints(id, points, cashierId, amount, reason);

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
