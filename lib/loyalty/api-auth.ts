import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AllowedRole = "ADMIN" | "CASHIER" | "CUSTOMER";

export interface AuthSuccess {
  authorized: true;
  user: { id: string; email?: string };
  role: AllowedRole;
}

export interface AuthFailure {
  authorized: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Validates the caller's session and role for API routes.
 * Enforces strict authentication and RBAC before executing route logic.
 */
export async function requireAuth(allowedRoles: AllowedRole[] = ["ADMIN", "CASHIER"]): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentification requise. Veuillez vous connecter." },
        { status: 401 }
      ),
    };
  }

  const role = (user.user_metadata?.role as AllowedRole) || "CUSTOMER";

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "FORBIDDEN", message: "Accès non autorisé pour ce profil." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email },
    role,
  };
}
