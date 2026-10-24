import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Home, Sparkles, User } from "lucide-react";

export interface CustomerNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const CUSTOMER_HOME_LINK: CustomerNavLink = { href: "/account", label: "Accueil", icon: Home };

/** Entries of the quick access menu of the mobile bottom bar (logout is added after them). */
export const CUSTOMER_MENU_LINKS: readonly CustomerNavLink[] = [
  { href: "/account/loyalty", label: "Ma fidélité", icon: Sparkles },
  { href: "/account/profile", label: "Mon profil", icon: User },
  { href: "/account/reservations", label: "Mes réservations", icon: CalendarCheck },
];

/** Pages of the customer space linked from the desktop header. */
export const CUSTOMER_NAV_LINKS: readonly CustomerNavLink[] = [
  CUSTOMER_HOME_LINK,
  { href: "/account/loyalty", label: "Fidélité", icon: Sparkles },
  { href: "/account/profile", label: "Profil", icon: User },
  { href: "/account/reservations", label: "Réservations", icon: CalendarCheck },
];
