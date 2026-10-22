import { createClient } from "@/lib/supabase/server";
import { resolveUserRole, type AppRole } from "@/lib/auth/roles";
import { getAppSettings } from "@/lib/settings/service";
import { STORE_TIME_ZONE } from "@/lib/store/config";
import { getOpeningStatus } from "@/lib/store/opening-hours";
import { SiteHeader, type AccountLink } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { OpeningHoursProvider } from "@/components/public/OpeningHoursProvider";
import { SiteAlerts } from "@/components/public/SiteAlerts";

const ACCOUNT_LINKS: Record<AppRole, AccountLink> = {
  CUSTOMER: { href: "/account", label: "Mon espace" },
  CASHIER: { href: "/cashier", label: "Ma caisse" },
  ADMIN: { href: "/admin", label: "Administration" },
};

/** The signed-in visitor's space, or null when nobody is signed in. */
async function getAccountLink(): Promise<AccountLink | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return ACCOUNT_LINKS[await resolveUserRole(supabase, user)];
}

/**
 * Shell of the customer-facing pages (home, auth, account, legal): one scroll container (§ 25.1)
 * holding the shared header, the page, then the shared footer. Admin and cashier dashboards have their own shells.
 * Pages render their root as `flex-1` (short pages push the footer down) and have no header of their own.
 * The shell uses `overflow-clip`, not `overflow-hidden`: a hidden box can still be scrolled by anchor
 * jumps (#fidelite), which pushed the whole page up and hid the header; a clipped box cannot.
 * The shell is `fixed inset-0` rather than `h-full`: iOS browsers can show more than `100svh` (on first load
 * the toolbars may already be collapsed), which left a blank band under the mobile action bar. A fixed box
 * always matches the visible viewport. Only html/body must not be fixed (§ 25.1).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ store, hours }, account] = await Promise.all([getAppSettings(), getAccountLink()]);
  const status = getOpeningStatus(new Date(), hours.weekly, STORE_TIME_ZONE, hours.closures);

  return (
    <OpeningHoursProvider hours={hours}>
      <div className="fixed inset-0 flex flex-col overflow-clip bg-background text-text">
        {/* Header, page parts and footer are direct children, so the sticky header stays pinned over the footer too.
            `*:shrink-0` keeps any child (footer included) from being squeezed by the column. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto motion-safe:scroll-smooth *:shrink-0">
          <SiteAlerts />
          <SiteHeader storeName={store.storeName} phone={store.phone} status={status} account={account} />
          {children}
          <SiteFooter
            storeName={store.storeName}
            tagline={store.tagline}
            address={store.address}
            phone={store.phone}
            email={store.email}
            weekly={hours.weekly}
          />
        </div>
      </div>
    </OpeningHoursProvider>
  );
}
