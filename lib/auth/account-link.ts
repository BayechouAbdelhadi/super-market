import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole, type AppRole } from "@/lib/auth/roles";
import type { AccountLink } from "@/components/public/site-nav";

const ACCOUNT_LINKS: Record<AppRole, AccountLink> = {
  CUSTOMER: { href: "/account", label: "Mon espace" },
  CASHIER: { href: "/cashier", label: "Ma caisse" },
  ADMIN: { href: "/admin", label: "Administration" },
};

/**
 * The signed-in visitor's space, or null when nobody is signed in.
 * Cached per request: the site layout and the home page both read it.
 */
export const getAccountLink = cache(async (): Promise<AccountLink | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return ACCOUNT_LINKS[await resolveUserRole(supabase, user)];
});
