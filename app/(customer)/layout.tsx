import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings/service";
import { SupabaseSelfProfileRepository } from "@/lib/account/adapters/supabase-self-profile-repository";
import { resolveDisplayIdentity } from "@/lib/account/identity";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerBottomNav } from "@/components/customer/CustomerBottomNav";

/**
 * Shell of the signed-in customer space (/account): its own header instead of the public site navigation,
 * the one scroll container (§ 25.1), then the mobile bottom bar. `fixed inset-0` for the same iOS reason
 * as app/(site)/layout.tsx. Pages render their root as `flex-1` and have no header of their own.
 * Pages still check the session and role themselves; the bar is only rendered for a signed-in user.
 */
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ store }, { data: { user } }] = await Promise.all([getAppSettings(), supabase.auth.getUser()]);
  const profile = user ? await new SupabaseSelfProfileRepository(supabase).getProfile(user.id) : null;
  const fullName = user ? resolveDisplayIdentity(profile, user).fullName || user.email || "Client" : "";

  return (
    <div className="fixed inset-0 flex flex-col overflow-clip bg-background text-text">
      <CustomerHeader storeName={store.storeName} customer={user ? { id: user.id, fullName } : null} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto *:shrink-0">{children}</div>
      {user && <CustomerBottomNav customerId={user.id} fullName={fullName} />}
    </div>
  );
}
