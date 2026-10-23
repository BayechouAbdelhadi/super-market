import { NextRequest, NextResponse } from "next/server";
import { editTransaction, getTransaction } from "@/lib/loyalty/service";
import { requireAuth } from "@/lib/loyalty/api-auth";
import { EditTransactionSchema, TransactionIdSchema } from "@/lib/loyalty/validation";

const STATUS_BY_CODE = { NOT_FOUND: 404, FORBIDDEN: 403, INVALID: 400, ERROR: 500 } as const;

async function readTransactionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = TransactionIdSchema.safeParse(id);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Identifiant de transaction invalide." },
        { status: 400 }
      ),
    };
  }
  return { id: parsed.data };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id, response: invalidId } = await readTransactionId(context.params);
  if (invalidId) return invalidId;

  const transaction = await getTransaction(id!);
  if (!transaction) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Transaction introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ transaction });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(["CASHIER", "ADMIN"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id, response: invalidId } = await readTransactionId(context.params);
    if (invalidId) return invalidId;

    const validation = EditTransactionSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Correction invalide.",
        },
        { status: 400 }
      );
    }

    const result = await editTransaction(
      id!,
      { amount: validation.data.amount, pointsRedeemed: validation.data.points_redeemed },
      { id: auth.user.id, role: auth.role }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status: STATUS_BY_CODE[result.code] },
      );
    }

    return NextResponse.json({
      message: "Transaction modifiée avec succès.",
      transaction: result.transaction,
      customer: result.customer,
    });
  } catch (err) {
    console.error("[PATCH /api/loyalty/transactions/[id]]", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur lors de la modification de la transaction." },
      { status: 500 },
    );
  }
}
