/** Home page sections linked from the site header (desktop bar and mobile menu). */
export const SITE_NAV_LINKS = [
  { href: "/#rayons", label: "Nos rayons" },
  { href: "/#infos", label: "Infos pratiques" },
  { href: "/#fidelite", label: "Fidélité" },
] as const;

/** Where the signed-in visitor's own space is (customer account, cashier or admin dashboard). */
export interface AccountLink {
  href: string;
  label: string;
}
