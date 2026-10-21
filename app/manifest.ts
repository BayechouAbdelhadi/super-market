import type { MetadataRoute } from "next";
import { activeTheme } from "@/lib/theme";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/config";

/** Web app manifest: name and icons when the site is added to a phone's home screen. Colors follow the theme. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Super Market",
    description: DEFAULT_DESCRIPTION,
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: activeTheme.light.background,
    theme_color: activeTheme.light.background,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
