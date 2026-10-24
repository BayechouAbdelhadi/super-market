import Link from "next/link";
import { Phone, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { phoneHref } from "@/lib/store/contact";
import type { AccountLink } from "@/components/public/site-nav";

interface MobileActionBarProps {
  phone: string;
  /** Signed-in visitor's space; null links to the login page */
  account: AccountLink | null;
}

/**
 * Phone-only bottom bar keeping the two visitor actions (call, account) one tap away.
 * Sticky inside the layout scroll container; it settles above the site footer at the end of the page.
 */
export function MobileActionBar({ phone, account }: MobileActionBarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className={phone ? "grid grid-cols-2 gap-3" : "grid"}>
        {phone && (
          <a href={phoneHref(phone)} className={buttonVariants({ variant: "secondary" })}>
            <Phone />
            <span>Appeler</span>
          </a>
        )}
        <Link href={account?.href ?? "/login"} className={buttonVariants({ variant: "primary" })}>
          <UserRound />
          <span>{account?.label ?? "Mon compte"}</span>
        </Link>
      </div>
    </div>
  );
}
