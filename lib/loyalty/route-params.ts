import { NextResponse } from "next/server";
import { CustomerIdSchema } from "./validation";

/**
 * Validates the `[id]` segment of customer API routes.
 * Returns the id, or a ready 400 response for malformed ids.
 */
export async function readCustomerId(
  params: Promise<{ id: string }>
): Promise<{ id: string; response?: undefined } | { id?: undefined; response: NextResponse }> {
  const { id } = await params;
  const parsed = CustomerIdSchema.safeParse(id);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Identifiant client invalide." },
        { status: 400 }
      ),
    };
  }
  return { id: parsed.data };
}
