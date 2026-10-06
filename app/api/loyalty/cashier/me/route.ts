import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabase as supabaseClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && (profile.role === "CASHIER" || profile.role === "ADMIN")) {
        return NextResponse.json({ cashier: profile });
      }
    }
  } catch (err) {
    console.error("Error retrieving authenticated user for cashier/me:", err);
  }

  // Fallback if not authenticated via session cookies
  const { data: profiles } = await supabaseClient
    .from("profiles")
    .select("*")
    .in("role", ["CASHIER", "ADMIN"])
    .limit(1);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ cashier: null }, { status: 404 });
  }

  return NextResponse.json({ cashier: profiles[0] });
}
