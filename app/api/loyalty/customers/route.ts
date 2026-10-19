import { NextRequest, NextResponse } from "next/server";
import { createCustomer, searchCustomers, searchCustomersPage } from "@/lib/loyalty/service";
import { parsePageParams } from "@/lib/loyalty/pagination";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { CreateCustomerSchema } from "@/lib/loyalty/validation";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { sendActivationEmail, shouldSendActivationEmail } from "@/lib/email/activation";
import { getAppSettings } from "@/lib/settings/service";
import { getAppOrigin } from "@/lib/utils/app-url";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const pageParams = parsePageParams(
    searchParams,
    LOYALTY_CONFIG.pagination.defaultPageSize,
    LOYALTY_CONFIG.pagination.maxPageSize
  );

  if (pageParams) {
    const { page, limit, offset } = pageParams;
    const { items, total } = await searchCustomersPage(q, limit, offset);

    return NextResponse.json({
      query: q,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: items.length,
      customers: items,
    });
  }

  const customers = await searchCustomers(q);
  const total = customers.length;

  return NextResponse.json({
    query: q,
    total,
    count: customers.length,
    customers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["CASHIER", "ADMIN"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validation = CreateCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Données client invalides.",
        },
        { status: 400 }
      );
    }

    const result = await createCustomer(validation.data);

    if (!result.success) {
      if (result.isDuplicate) {
        return NextResponse.json(
          {
            error: "DUPLICATE_CUSTOMER",
            field: result.field,
            message: result.message,
            existingCustomer: result.existingCustomer,
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: result.error,
        },
        { status: 400 },
      );
    }

    const customer = result.customer;

    // Send account activation email to the customer
    if (customer.email) {
      try {
        const settings = await getAppSettings();
        if (shouldSendActivationEmail("CUSTOMER", settings)) {
          const account = { email: customer.email, name: customer.full_name, role: "CUSTOMER" as const };
          sendActivationEmail(account, getAppOrigin(req.headers), settings).catch((err) => {
            console.error("[POST /api/loyalty/customers] Failed to send activation email:", err);
          });
        }
      } catch (emailErr) {
        console.error("[POST /api/loyalty/customers] Error preparing activation email:", emailErr);
      }
    }

    return NextResponse.json(
      {
        message: "Client créé avec succès.",
        customer: result.customer,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Erreur inconnue lors de la création du client.",
      },
      { status: 500 },
    );
  }
}
