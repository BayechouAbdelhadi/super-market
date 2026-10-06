import { NextRequest, NextResponse } from "next/server";
import { getCustomerDetail } from "@/lib/loyalty/service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Client avec l'identifiant '${id}' introuvable.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    customer_id: id,
    count: customer.transactions.length,
    transactions: customer.transactions,
  });
}
