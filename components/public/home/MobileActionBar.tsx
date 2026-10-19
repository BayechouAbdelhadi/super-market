import { Navigation, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { phoneHref } from "@/lib/store/contact";
import { STORE_LOCATION } from "@/lib/store/config";

/**
 * Phone-only bottom bar keeping the two visitor actions (call, directions) one tap away.
 * Sticky inside the layout scroll container; it settles above the site footer at the end of the page.
 */
export function MobileActionBar({ phone }: { phone: string }) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className={phone ? "grid grid-cols-2 gap-3" : "grid"}>
        {phone && (
          <a href={phoneHref(phone)} className={buttonVariants({ variant: "secondary" })}>
            <Phone />
            <span>Appeler</span>
          </a>
        )}
        <a
          href={STORE_LOCATION.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "primary" })}
        >
          <Navigation />
          <span>Itinéraire</span>
        </a>
      </div>
    </div>
  );
}
