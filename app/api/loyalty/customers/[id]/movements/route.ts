import { NextRequest, NextResponse } from "next/server";
import { loyaltyStore } from "@/lib/loyalty/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const customer = loyaltyStore.findCustomerById(id);

  if (!customer) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Client avec l'identifiant '${id}' introuvable.` },
      { status: 404 },
    );
  }

  const movements = loyaltyStore.getMovementsByCustomer(id);

  return NextResponse.json({
    customer_id: id,
    count: movements.length,
    movements,
  });
}
