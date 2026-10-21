export interface SiteNavLink {
  href: string;
  label: string;
  /** Shows a red dot on the entry (and on the mobile menu button) to draw attention to it. */
  dot?: boolean;
}

/** Home page sections and site pages linked from the site header (desktop bar and mobile menu). */
export const SITE_NAV_LINKS: readonly SiteNavLink[] = [
  { href: "/#rayons", label: "Nos rayons" },
  { href: "/actualites", label: "Actualités", dot: true },
  { href: "/#infos", label: "Infos pratiques" },
  { href: "/#fidelite", label: "Fidélité" },
];

/** True when an entry has a dot, so the closed mobile menu button shows one too. */
export const SITE_NAV_HAS_DOT = SITE_NAV_LINKS.some((link) => link.dot);

/** Where the signed-in visitor's own space is (customer account, cashier or admin dashboard). */
export interface AccountLink {
  href: string;
  label: string;
}
