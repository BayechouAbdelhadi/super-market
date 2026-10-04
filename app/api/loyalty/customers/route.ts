import { NextRequest, NextResponse } from "next/server";
import { createCustomer, searchCustomers } from "@/lib/loyalty/service";
import { loyaltyStore } from "@/lib/loyalty/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const customers = searchCustomers(q);

  return NextResponse.json({
    query: q,
    count: customers.length,
    customers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cashier = loyaltyStore.getCashier();

    const result = createCustomer(
      {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
      },
      cashier.id,
    );

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
