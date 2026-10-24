import { NextResponse } from "next/server";
import type { z } from "zod";
import { ARRIVAL_ERROR_MESSAGES } from "./config";
import { ArrivalError, type ArrivalErrorCode } from "./types";

const STATUS_BY_CODE: Record<ArrivalErrorCode, number> = {
  ARRIVAL_NOT_FOUND: 404,
  RESERVATION_NOT_FOUND: 404,
  ITEM_NOT_FOUND: 409,
  RESERVATION_NOT_OPEN: 409,
  RESERVATION_CLOSED: 409,
  ALREADY_RESERVED: 409,
  MAX_PER_CUSTOMER: 409,
  OUT_OF_STOCK: 409,
  INVALID_TRANSITION: 409,
  STOCK_BELOW_RESERVED: 409,
  ITEM_HAS_RESERVATIONS: 409,
  HAS_ACTIVE_RESERVATIONS: 409,
};

/** 400 response for the first issue of a failed Zod parse. */
export function validationError(error: z.ZodError, fallback: string) {
  const issue = error.issues[0];
  return NextResponse.json(
    { error: "VALIDATION_ERROR", message: issue?.message || fallback, field: issue?.path[0] },
    { status: 400 }
  );
}

/**
 * Translates a failure of the arrivals service: business errors get their status and
 * French message, anything else is logged with the route name and returns 500.
 */
export function arrivalErrorResponse(err: unknown, route: string, errorCode: string, fallback: string) {
  if (err instanceof ArrivalError) {
    return NextResponse.json(
      { error: err.code, message: ARRIVAL_ERROR_MESSAGES[err.code], itemId: err.itemId },
      { status: STATUS_BY_CODE[err.code] }
    );
  }
  console.error(`[${route}] Error:`, err);
  return NextResponse.json({ error: errorCode, message: fallback }, { status: 500 });
}

export const ARRIVAL_NOT_FOUND_BODY = { error: "NOT_FOUND", message: ARRIVAL_ERROR_MESSAGES.ARRIVAL_NOT_FOUND };

/** 404 for a route of the arrivals feature while its flag is off (lib/arrivals/flags.ts). */
export function featureDisabledResponse() {
  return NextResponse.json(
    { error: "FEATURE_DISABLED", message: "Les arrivages arrivent bientôt." },
    { status: 404 }
  );
}
