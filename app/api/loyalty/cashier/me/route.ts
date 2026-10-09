import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/loyalty/api-auth";

export async function GET() {
  const auth = await requireAuth(["CASHIER", "ADMIN"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Profil caissier introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ cashier: profile });
  } catch (err: any) {
    console.error("Error retrieving authenticated user for cashier/me:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur lors de la récupération du profil." },
      { status: 500 }
    );
  }
}
