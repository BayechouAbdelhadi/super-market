import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  // In a real implementation with Auth cookies, you'd use:
  // const { data: { user } } = await supabase.auth.getUser();
  // For now, we fetch the first available cashier to keep the app working.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "CASHIER")
    .limit(1);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ cashier: null }, { status: 404 });
  }

  return NextResponse.json({ cashier: profiles[0] });
}
