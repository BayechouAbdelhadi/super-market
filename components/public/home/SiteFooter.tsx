import Image from "next/image";
import Link from "next/link";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { STORE_LOCATION } from "@/lib/store/config";

interface SiteFooterProps {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
}

const linkClass = "text-text-muted transition-colors hover:text-text hover:underline underline-offset-4";

export function SiteFooter({ storeName, tagline, address, phone, email }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 text-sm sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border p-0.5">
                <Image src="/logo-hq.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
              </span>
              <span className="font-semibold text-text">{storeName}</span>
            </div>
            <p className="text-text-muted">{tagline}</p>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-text">Contact</h2>
            <ul className="space-y-2">
              <li className="text-text-muted">{address}</li>
              {phone && (
                <li>
                  <a href={phoneHref(phone)} className={linkClass}>
                    {formatPhone(phone)}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-text">Liens utiles</h2>
            <ul className="space-y-2">
              <li>
                <a href={STORE_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Itinéraire
                </a>
              </li>
              <li>
                <Link href="/login" className={linkClass}>
                  Mon compte fidélité
                </Link>
              </li>
              <li>
                <Link href="/politique-de-confidentialite" className={linkClass}>
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-border pt-6 text-text-muted">
          © {new Date().getFullYear()} {storeName}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
