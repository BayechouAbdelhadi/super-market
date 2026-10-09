import { NextRequest, NextResponse } from "next/server";
import { getCustomerDetail } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
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
  const total = customer.transactions.length;

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
    const paginated = customer.transactions.slice(start, start + limit);

    return NextResponse.json({
      customer_id: id,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: paginated.length,
      transactions: paginated,
    });
  }

  return NextResponse.json({
    customer_id: id,
    total,
    count: customer.transactions.length,
    transactions: customer.transactions,
  });
}
