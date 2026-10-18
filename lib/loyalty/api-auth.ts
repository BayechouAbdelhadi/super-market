import { NextResponse } from "next/server";
import { getSessionCaller } from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/roles";

export type AllowedRole = AppRole;

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
  const caller = await getSessionCaller(allowedRoles);

  if (!caller.ok && caller.reason === "UNAUTHENTICATED") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentification requise. Veuillez vous connecter." },
        { status: 401 }
      ),
    };
  }

  if (!caller.ok) {
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
    user: { id: caller.user.id, email: caller.user.email },
    role: caller.role,
  };
}
