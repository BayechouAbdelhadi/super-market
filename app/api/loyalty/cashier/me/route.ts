import { NextResponse } from "next/server";
import { loyaltyStore } from "@/lib/loyalty/store";

export async function GET() {
  const cashier = loyaltyStore.getCashier();
  return NextResponse.json({ cashier });
}
