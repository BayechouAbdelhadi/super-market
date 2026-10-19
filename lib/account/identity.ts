import type { SelfProfileRow } from "./ports";

export interface DisplayIdentity {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthUserLike {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function metadataString(user: AuthUserLike, key: string): string {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : "";
}

/**
 * Name and contact details to display, preferring the profile row and falling back to
 * the auth account (display data only — never used for authorization).
 */
export function resolveDisplayIdentity(profile: SelfProfileRow | null, user: AuthUserLike): DisplayIdentity {
  const firstName = profile?.first_name || metadataString(user, "first_name");
  const lastName = profile?.last_name || metadataString(user, "last_name");
  const email = profile?.email || user.email || "";
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    phone: profile?.phone_number || metadataString(user, "phone_number"),
  };
}
