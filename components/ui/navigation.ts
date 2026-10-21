import {
  Activity,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  QrCode,
  Sliders,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DashboardRole = "ADMIN" | "CASHIER" | "CUSTOMER";

export interface NavItem {
  /** Full label (sidebar, mobile menu sheet). */
  name: string;
  /** Compact label for the mobile bottom bar. */
  shortName: string;
  href: string;
  icon: LucideIcon;
  isLive?: boolean;
  /** Shown directly in the mobile bottom bar; the others live in the "Menu" sheet. */
  mobilePrimary?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { name: "Accueil", shortName: "Accueil", href: "/admin", icon: LayoutDashboard, mobilePrimary: true },
  { name: "Caisse Fidélité", shortName: "Caisse", href: "/admin/pos", icon: CreditCard, mobilePrimary: true },
  { name: "Analytics & Ventes", shortName: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Gestion Clients", shortName: "Clients", href: "/admin/customers", icon: Users, mobilePrimary: true },
  { name: "Gestion Caissiers", shortName: "Caissiers", href: "/admin/cashiers", icon: UserCog, mobilePrimary: true },
  { name: "Affiche & QR Code", shortName: "QR Code", href: "/admin/invite", icon: QrCode },
  { name: "Flux en direct", shortName: "Live", href: "/admin/live", icon: Activity, isLive: true },
  { name: "Bons Plans & Emails", shortName: "Bons Plans", href: "/admin/deals", icon: Sparkles },
  { name: "Actualités", shortName: "Actualités", href: "/admin/news", icon: Newspaper },
  { name: "Alertes du site", shortName: "Alertes", href: "/admin/alerts", icon: Megaphone },
  { name: "Paramètres", shortName: "Paramètres", href: "/admin/settings", icon: Sliders },
];

const CASHIER_NAV: NavItem[] = [
  { name: "Accueil", shortName: "Accueil", href: "/cashier", icon: LayoutDashboard, mobilePrimary: true },
  { name: "Caisse Fidélité", shortName: "Caisse", href: "/cashier/pos", icon: CreditCard, mobilePrimary: true },
  { name: "Gestion Clients", shortName: "Clients", href: "/cashier/customers", icon: Users, mobilePrimary: true },
];

export function getNavItems(role: DashboardRole): NavItem[] {
  return role === "ADMIN" ? ADMIN_NAV : CASHIER_NAV;
}

/** Root routes match exactly; others also match their sub-routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/cashier") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
