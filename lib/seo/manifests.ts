import type { MetadataRoute } from "next";
import { activeTheme } from "@/lib/theme";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/config";

/** URL of the admin app manifest. Must not start with /admin (the auth proxy protects that prefix): browsers fetch manifests without cookies, so the auth proxy would redirect it to /login. */
export const ADMIN_MANIFEST_PATH = "/manifest-admin.webmanifest";

/** Name of the admin app under its home screen icon. */
export const ADMIN_APP_TITLE = "SM Admin";

const ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const SHARED: MetadataRoute.Manifest = {
  lang: "fr",
  display: "standalone",
  background_color: activeTheme.light.background,
  theme_color: activeTheme.light.background,
  icons: ICONS,
};

/** Public site, added to a phone's home screen: opens on the home page. */
export const PUBLIC_MANIFEST: MetadataRoute.Manifest = {
  ...SHARED,
  name: SITE_NAME,
  short_name: "Super Market",
  description: DEFAULT_DESCRIPTION,
  start_url: "/",
};

/**
 * Admin app, installed on the store tablet: its own `id`, so it is a separate app from the public one, and opens on /admin.
 * Scope stays "/" so the sign-in pages (/login, /auth/callback) open inside the app and its session is set there.
 */
export const ADMIN_MANIFEST: MetadataRoute.Manifest = {
  ...SHARED,
  id: "/admin",
  name: `${SITE_NAME} — Administration`,
  short_name: ADMIN_APP_TITLE,
  start_url: "/admin",
  scope: "/",
};
