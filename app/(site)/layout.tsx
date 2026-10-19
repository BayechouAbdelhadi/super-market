import { getAppSettings } from "@/lib/settings/service";
import { SiteFooter } from "@/components/public/SiteFooter";

/**
 * Shell of the customer-facing pages (home, auth, account, legal): one scroll container (§ 25.1)
 * holding the page, then the shared footer. Admin and cashier dashboards have their own shells.
 * Pages render as `flex-1` content; sticky headers inside them stick to this container.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { store } = await getAppSettings();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-text">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto motion-safe:scroll-smooth">
        <div className="flex flex-1 flex-col">{children}</div>
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
