import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
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
    <html lang="fr" className={`${inter.variable} font-sans antialiased`}>
      <body className="h-full overflow-hidden font-sans">{children}</body>
    </html>
  );
}
