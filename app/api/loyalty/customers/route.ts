import { NextRequest, NextResponse } from "next/server";
import { createCustomer, searchCustomers } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { CreateCustomerSchema } from "@/lib/loyalty/validation";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { emailService } from "@/lib/email";
import {
  createSignedToken,
  AccountActivationPayload,
} from "@/lib/email/otp-security";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const customers = await searchCustomers(q);
  const total = customers.length;

  if (pageParam || limitParam) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(
      LOYALTY_CONFIG.pagination.maxPageSize,
      Math.max(
        1,
        parseInt(limitParam || `${LOYALTY_CONFIG.pagination.defaultPageSize}`, 10) ||
          LOYALTY_CONFIG.pagination.defaultPageSize
      )
    );
    const start = (page - 1) * limit;
    const paginated = customers.slice(start, start + limit);

    return NextResponse.json({
      query: q,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: paginated.length,
      customers: paginated,
    });
  }

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
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
        const token = createSignedToken<AccountActivationPayload>({
          email: customer.email.toLowerCase().trim(),
          role: "CUSTOMER",
          type: "ACCOUNT_ACTIVATION",
          expiresAt,
        });

        const host = req.headers.get("host") || "localhost:3000";
        const proto =
          req.headers.get("x-forwarded-proto") ||
          (host.includes("localhost") ? "http" : "https");
        const origin = `${proto}://${host}`;
        const activationLink = `${origin}/confirm-account?token=${encodeURIComponent(token)}`;

        emailService
          .sendAccountActivation({
            email: customer.email,
            name: customer.full_name,
            activationLink,
            role: "CUSTOMER",
            expiresInDays: 7,
          })
          .catch((err) => {
            console.error(
              "[POST /api/loyalty/customers] Failed to send activation email:",
              err
            );
          });
      } catch (emailErr) {
        console.error(
          "[POST /api/loyalty/customers] Error preparing activation email:",
          emailErr
        );
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
