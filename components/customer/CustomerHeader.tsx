import Image from "next/image";
import Link from "next/link";
import { LogOut, QrCode } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/(site)/login/actions";
import { StoreCardQrDialog } from "@/components/loyalty/StoreCardQrDialog";
import { CustomerNavLinks } from "./CustomerNavLinks";

interface CustomerHeaderProps {
  storeName: string;
  /** Signed-in customer, for the store card QR code; null hides it */
  customer: { id: string; fullName: string } | null;
}

/**
 * Top bar of the customer space. The logo leads back to the store site; the page links and logout
 * show from `md` up, below that they move to CustomerBottomNav.
 * Sits at the top of the flex column of app/(customer)/layout.tsx, so it needs no `sticky` (§ 25.4).
 */
export function CustomerHeader({ storeName, customer }: CustomerHeaderProps) {
  return (
    <header className="z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 md:h-18">
        <Link href="/" aria-label={`Site de ${storeName}`} className="flex min-w-0 items-center gap-3 rounded-[var(--radius-button)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface p-0.5">
            <Image src="/logo-hq.png" alt="" width={40} height={40} priority className="h-full w-full object-contain" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-text">{storeName}</span>
        </Link>

        <CustomerNavLinks />

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {customer && (
            <StoreCardQrDialog
              customerId={customer.id}
              fullName={customer.fullName}
              trigger={
                <button type="button" aria-label="Afficher ma carte du magasin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                  <QrCode />
                </button>
              }
            />
          )}
          <form action={logout}>
            <button type="submit" aria-label="Se déconnecter" className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <LogOut />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
