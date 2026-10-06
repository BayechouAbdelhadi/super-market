import { NextRequest, NextResponse } from "next/server";
import { recordPurchase } from "@/lib/loyalty/service";
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

    const amount = Number(body.amount);
    const result = await recordPurchase(id, amount, cashierId);

    if (!result.success) {
      return NextResponse.json(
        { error: "PURCHASE_ERROR", message: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Achat enregistré et points crédités avec succès.",
        purchase: result.purchase,
        movement: result.movement,
        customer: result.customer,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'achat.",
      },
      { status: 500 },
    );
  }
}
