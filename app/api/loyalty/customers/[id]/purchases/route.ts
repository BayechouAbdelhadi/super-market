import { NextRequest, NextResponse } from "next/server";
import { recordPurchase, getCustomerDetail, getCustomerPurchasesPage } from "@/lib/loyalty/service";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { readCustomerId } from "@/lib/loyalty/route-params";
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

  const { id, response: invalidId } = await readCustomerId(context.params);
  if (invalidId) return invalidId;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `Client avec l'identifiant '${id}' introuvable.` },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(req.url);
  const pageParams = parsePageParams(
    searchParams,
    LOYALTY_CONFIG.pagination.tablePageSize,
    LOYALTY_CONFIG.pagination.maxPageSize
  );

  if (pageParams) {
    const { page, limit, offset } = pageParams;
    const { items, total } = await getCustomerPurchasesPage(id, limit, offset);

    return NextResponse.json({
      customer_id: id,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: items.length,
      purchases: items,
    });
  }

  const purchases = customer.purchases || [];
  const total = purchases.length;

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

    const { id, response: invalidId } = await readCustomerId(context.params);
    if (invalidId) return invalidId;
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
