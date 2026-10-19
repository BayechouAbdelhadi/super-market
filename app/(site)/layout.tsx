import { getAppSettings } from "@/lib/settings/service";
import { SiteFooter } from "@/components/public/SiteFooter";

/**
 * Shell of the customer-facing pages (home, auth, account, legal): one scroll container (§ 25.1)
 * holding the page, then the shared footer. Admin and cashier dashboards have their own shells.
 * Pages render their root as `flex-1` (short pages push the footer down); sticky headers stick to this container.
 * The shell uses `overflow-clip`, not `overflow-hidden`: a hidden box can still be scrolled by anchor
 * jumps (#fidelite), which pushed the whole page up and hid the header; a clipped box cannot.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { store } = await getAppSettings();

  return (
    <div className="flex h-full w-full flex-col overflow-clip bg-background text-text">
      {/* Page parts are direct children, so a page's sticky header stays pinned over the footer too.
          `*:shrink-0` keeps any child (footer included) from being squeezed by the column. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto motion-safe:scroll-smooth *:shrink-0">
        {children}
        <SiteFooter
          storeName={store.storeName}
          tagline={store.tagline}
          address={store.address}
          phone={store.phone}
          email={store.email}
        />
      </div>
    </div>
  );
}
