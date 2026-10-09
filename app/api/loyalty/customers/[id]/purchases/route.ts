import { NextRequest, NextResponse } from "next/server";
import { recordPurchase, getCustomerDetail } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { RecordPurchaseSchema } from "@/lib/loyalty/validation";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await context.params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Client avec l'identifiant '${id}' introuvable.` },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const purchases = customer.purchases || [];
  const total = purchases.length;

  if (pageParam || limitParam) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(
      LOYALTY_CONFIG.pagination.maxPageSize,
      Math.max(
        1,
        parseInt(limitParam || `${LOYALTY_CONFIG.pagination.tablePageSize}`, 10) ||
          LOYALTY_CONFIG.pagination.tablePageSize
      )
    );
    const start = (page - 1) * limit;
    const paginated = purchases.slice(start, start + limit);

    return NextResponse.json({
      customer_id: id,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: paginated.length,
      purchases: paginated,
    });
  }

  return NextResponse.json({
    customer_id: id,
    total,
    count: purchases.length,
    purchases,
  });
}

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

    const validation = RecordPurchaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Montant d'achat invalide.",
        },
        { status: 400 }
      );
    }

    const { amount } = validation.data;
    const cashierId = auth.user.id;

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
