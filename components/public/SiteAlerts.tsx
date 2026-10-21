import { getBannerAlerts } from "@/lib/alerts/service";
import { DismissibleSiteAlerts } from "./DismissibleSiteAlerts";
import { HIDE_DISMISSED_SCRIPT } from "./dismissed-alerts";

/** Active alerts published by the admin, most severe first, above the site header. Visitors can close them. */
export async function SiteAlerts() {
  const alerts = await getBannerAlerts();
  if (alerts.length === 0) return null;

  return (
    <section aria-label="Annonces du magasin">
      <script dangerouslySetInnerHTML={{ __html: HIDE_DISMISSED_SCRIPT }} />
      <DismissibleSiteAlerts alerts={alerts} />
    </section>
  );
}
