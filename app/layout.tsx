import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { activeTheme, themeToCss } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SuperMarket — Alimentation Générale & Produits Frais",
    template: "%s | SuperMarket",
  },
  description:
    "SuperMarket : Vos courses du quotidien, produits frais tous les jours et service caisse de proximité.",
  icons: {
    icon: [
      { url: "/logo.jpeg" },
    ],
    apple: [
      { url: "/logo.jpeg" },
    ],
  },
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
