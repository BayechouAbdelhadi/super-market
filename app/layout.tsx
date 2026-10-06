import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
