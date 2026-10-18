import { NextRequest, NextResponse } from "next/server";
import { getCustomerDetail } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { readCustomerId } from "@/lib/loyalty/route-params";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id, response: invalidId } = await readCustomerId(context.params);
  if (invalidId) return invalidId;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Client avec l'identifiant '${id}' introuvable.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ customer });
}
