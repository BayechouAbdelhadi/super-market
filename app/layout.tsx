import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { activeTheme, themeToCss } from "@/lib/theme";
import { BASE_OPEN_GRAPH, DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME } from "@/lib/seo/config";
import { getSiteUrl } from "@/lib/utils/app-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Icons come from the app/ files (favicon.ico, icon.svg, apple-icon.png) and app/manifest.ts
export const metadata: Metadata = {
  // Makes relative URLs (canonical, Open Graph images) absolute, on the canonical domain
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { ...BASE_OPEN_GRAPH, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${inter.className} font-sans antialiased`}>
      <head>
        {/* Theme colors and radii (lib/theme): one place to restyle the whole app */}
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: themeToCss(activeTheme) }} />
      </head>
      <body className="h-full overflow-hidden font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
