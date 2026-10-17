"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Clock,
  Store,
  Navigation,
  ExternalLink,
  Package,
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Gift,
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
} from "lucide-react";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Super+Market/@50.9465158,1.894816,17z/data=!3m1!4b1!4m6!3m5!1s0x47dc408d16b83147:0x741d64b6f3748726!8m2!3d50.9465158!4d1.8973909!16s%2Fg%2F11s0z94vkk";

const STORE_DETAILS = {
  name: "Super Market",
  city: "Calais",
  address: "205 Avenue Antoine de Saint-Exupéry",
  postalCode: "62100",
  fullAddress: "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  phone: "06 71 54 05 28",
  phoneRaw: "tel:0671540528",
  siret: "885 125 666 00010",
  schedule: [
    { day: "Lundi", hours: "09:00 – 12:30 & 14:00 – 19:30", isWeekend: false, dayIndex: 1 },
    { day: "Mardi", hours: "09:00 – 12:30 & 14:00 – 19:30", isWeekend: false, dayIndex: 2 },
    { day: "Mercredi", hours: "09:00 – 12:30 & 14:00 – 19:30", isWeekend: false, dayIndex: 3 },
    { day: "Jeudi", hours: "09:00 – 12:30 & 14:00 – 19:30", isWeekend: false, dayIndex: 4 },
    { day: "Vendredi", hours: "09:00 – 12:30 & 14:00 – 19:30", isWeekend: false, dayIndex: 5 },
    { day: "Samedi", hours: "09:00 – 19:30 (Non-stop)", isWeekend: true, dayIndex: 6 },
    { day: "Dimanche", hours: "09:00 – 19:30 (Non-stop)", isWeekend: true, dayIndex: 0 },
  ],
};

function getIsOpenNow(): { isOpen: boolean; statusText: string } {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;

  // Mon-Fri: 9:00 (540) to 12:30 (750) and 14:00 (840) to 19:30 (1170)
  // Sat & Sun: 9:00 (540) to 19:30 (1170)
  if (day >= 1 && day <= 5) {
    if ((currentTime >= 540 && currentTime < 750) || (currentTime >= 840 && currentTime < 1170)) {
      return { isOpen: true, statusText: "Ouvert actuellement • Ferme à 19h30" };
    }
    if (currentTime >= 750 && currentTime < 840) {
      return { isOpen: false, statusText: "Pause déjeuner • Réouverture à 14h00" };
    }
    return { isOpen: false, statusText: "Fermé actuellement • Ouvre à 09h00" };
  } else {
    // Saturday & Sunday non-stop
    if (currentTime >= 540 && currentTime < 1170) {
      return { isOpen: true, statusText: "Ouvert en continu aujourd'hui • Ferme à 19h30" };
    }
    return { isOpen: false, statusText: "Fermé actuellement • Ouvre à 09h00" };
  }
}

export default function Home() {
  const [openStatus, setOpenStatus] = useState({ isOpen: true, statusText: "Ouvert 7j/7 à Calais" });
  const [appSettings, setAppSettings] = useState<{
    euroRatio: number;
    store: {
      storeName: string;
      tagline: string;
      address: string;
      phone: string;
      email: string;
    };
  }>({
    euroRatio: 1,
    store: {
      storeName: "Super Market Calais",
      tagline: "Votre magasin de proximité & primeur frais à Calais",
      address: "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
      phone: "06 71 54 05 28",
      email: "contact@supermarket-calais.fr",
    },
  });
  const currentDayIndex = new Date().getDay();

  useEffect(() => {
    setOpenStatus(getIsOpenNow());
    const interval = setInterval(() => {
      setOpenStatus(getIsOpenNow());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setAppSettings({
              euroRatio: data.settings.loyalty?.euroToPointsRatio ?? 1,
              store: {
                storeName: data.settings.store?.storeName || "Super Market Calais",
                tagline: data.settings.store?.tagline || "Votre magasin de proximité & primeur frais à Calais",
                address: data.settings.store?.address || "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
                phone: data.settings.store?.phone || "06 71 54 05 28",
                email: data.settings.store?.email || "contact@supermarket-calais.fr",
              },
            });
          }
        }
      } catch {
        // Keep default
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--color-background)] text-[var(--color-text)] font-sans selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-text)]">
      {/* Main Scrollable Viewport Container (§ 25.1) */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col relative">
        {/* Rich Radial Gradient Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top Center Main Radial Aura */}
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1100px] h-[750px] bg-[radial-gradient(ellipse_at_center,rgba(255,56,92,0.18)_0%,rgba(251,146,60,0.12)_35%,rgba(255,255,255,0)_70%)] blur-2xl" />

          {/* Right Floating Warm Amber Radial Halo */}
          <div className="absolute top-[280px] -right-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16)_0%,rgba(251,113,133,0.08)_40%,rgba(255,255,255,0)_70%)] blur-3xl animate-pulse-glow" style={{ animationDuration: "8s" }} />

          {/* Left Mid-page Fresh Mint & Sky Radial Halo */}
          <div className="absolute top-[750px] -left-[15%] w-[850px] h-[850px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,rgba(56,189,248,0.08)_40%,rgba(255,255,255,0)_70%)] blur-3xl animate-pulse-glow" style={{ animationDelay: "4s", animationDuration: "9s" }} />

          {/* Bottom Warm Coral Radial Anchor */}
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,56,92,0.1)_0%,rgba(245,158,11,0.06)_45%,rgba(255,255,255,0)_75%)] blur-3xl" />
        </div>

        {/* Full-width 100% Super Market Calais Storefront Banner with Transparent Floating Header */}
        <section className="w-full relative shrink-0 aspect-[16/8] sm:aspect-[21/9] md:aspect-[24/9] max-h-[520px] min-h-[300px] bg-neutral-900 border-b border-[var(--color-border)] overflow-hidden group z-10 flex flex-col justify-between">
          <Image
            src="/super-market-calais-storefront.webp"
            alt="Super Market Calais — Magasin & Devanture au 205 Avenue Antoine de Saint-Exupéry"
            fill
            priority
            className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
            sizes="100vw"
          />

          {/* Transparent Gradient Protection: Soft at bottom for text contrast, clear at top for white transparent header */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

          {/* Light Pink-White Linear Gradient Top Navigation Header (No Transparency) */}
          <div className="relative z-20 w-full bg-[linear-gradient(105deg,#ffffff_0%,#fff9fa_25%,#fff1f4_50%,#fff9fa_75%,#ffffff_100%)] border-b border-[rgba(255,56,92,0.12)] shadow-xs">
            {/* Top Micro Notice Bar with Light Rose-White Solid Gradient */}
            <div className="bg-[linear-gradient(90deg,#fffdfd_0%,#fff5f7_50%,#fffdfd_100%)] text-neutral-900 text-[11px] py-1.5 px-4 text-center font-medium border-b border-[rgba(255,56,92,0.08)]">
              <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 flex-wrap">
                <span className="font-extrabold uppercase tracking-wider bg-[var(--color-primary)] text-white px-2.5 py-0.5 rounded-full text-[10px] shadow-[0_2px_8px_rgba(255,56,92,0.35)]">
                  Calais Saint-Exupéry
                </span>
                <span className="text-neutral-800 font-medium">Votre supermarché de quartier ouvert 7j/7 avec primeur frais et point relais Pickup !</span>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] font-bold hover:underline inline-flex items-center gap-1 ml-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Main Navigation Bar */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-white border border-[rgba(255,56,92,0.25)] shadow-xs flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                  <Image
                    src="/logo-hq.png"
                    alt="SuperMarket Calais Logo"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight text-neutral-950">
                      {appSettings.store.storeName}
                    </span>
                    <span
                      className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        openStatus.isOpen
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      <span>{openStatus.isOpen ? "Ouvert" : "Fermé"}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e293f] font-semibold hidden sm:block">
                    Saint-Exupéry, Calais • Primeur &amp; Relais Pickup
                  </p>
                </div>
              </div>

              {/* Quick Contact & Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {appSettings.store.phone && (
                  <a
                    href={`tel:${appSettings.store.phone.replace(/\s+/g, "")}`}
                    className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(255,56,92,0.22)] bg-white hover:bg-rose-50/60 text-xs font-semibold text-neutral-900 hover:border-[var(--color-primary)] transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{appSettings.store.phone}</span>
                  </a>
                )}

                <Link href="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold shadow-[0_2px_12px_rgba(255,56,92,0.35)] h-9 gap-1.5"
                  >
                    <span>Votre compte</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Info & Tagline on top of Image */}
          <div className="relative z-20 p-5 sm:p-8 md:p-12 text-white mt-auto">
            <div className="max-w-6xl mx-auto w-full space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/20 text-xs font-bold text-white w-fit shadow-lg shadow-black/40">
                <Store className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>{appSettings.store.storeName} • Calais</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight max-w-3xl">
                {appSettings.store.tagline}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-neutral-200 font-medium pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ouvert 7j/7</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Surface +300 m²</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Primeur &amp; Surgelés</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Relais Pickup La Poste</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-5 sm:pt-7 pb-12 sm:pb-16 max-w-6xl mx-auto w-full space-y-16 relative z-10">
        {/* 1. Hero Section */}
        <section className="space-y-4 max-w-3xl mx-auto text-center relative">
          {/* Ambient live badge with subtle glow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-[var(--color-border-hover)] transition-all">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                openStatus.isOpen ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" : "bg-amber-500 ring-4 ring-amber-500/20"
              }`}
            />
            <span className="text-[var(--color-text)] font-bold">{openStatus.statusText}</span>
            <span className="opacity-40">•</span>
            <span>Ouvert 7 jours sur 7</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-text)] tracking-tight leading-[1.12]">
            Votre supermarché de quartier à{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Calais Saint-Exupéry.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl mx-auto font-normal">
            Alimentation générale de proximité, boucherie &amp; volailles fraîches en barquette, primeur, boissons en pack au meilleur prix et point relais Pickup La Poste avec programme fidélité sans carte (1 € = {appSettings.euroRatio} pt{appSettings.euroRatio > 1 ? "s" : ""}).
          </p>

          {/* Quick action buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="lg"
                className="font-bold gap-2 shadow-[0_4px_16px_rgba(255,56,92,0.35)] hover:shadow-[0_6px_22px_rgba(255,56,92,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Itinéraire Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </Button>
            </a>

            <a href={STORE_DETAILS.phoneRaw}>
              <Button
                variant="secondary"
                size="lg"
                className="font-semibold gap-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Appeler le {STORE_DETAILS.phone}</span>
              </Button>
            </a>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="font-semibold gap-2 border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] shadow-xs transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Votre compte</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* 2. Nos Rayons & Produits Frais (Products First) */}
        <section className="w-full space-y-6">
          <div className="text-left space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <span>Arrivages &amp; Sélections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Nos Rayons &amp; Produits Frais
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Une sélection rigoureuse pour régaler toute la famille au meilleur prix à Calais
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* 1. Poulet Frais & Charcuterie */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-rose-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                🍗
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Poulet Frais &amp; Charcuterie
                  </h3>
                  <Badge variant="brand" size="sm">Fraîcheur</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Poulet frais disponible en barquette : filet de poulet, cuisses, ailes et pilons de qualité supérieure, accompagnés de notre sélection de charcuterie traditionnelle.
                </p>
              </div>
            </Card>

            {/* 2. Boissons en pack */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-blue-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                🥤
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Boissons en Pack
                  </h3>
                  <Badge variant="brand" size="sm">N°1 à Calais</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Le numéro 1 de la boisson en pack sur Calais ! Plus de 60 références en stock permanent : sodas, jus, eaux et boissons rafraîchissantes aux meilleurs prix.
                </p>
              </div>
            </Card>

            {/* 3. Surgelés */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-sky-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                ❄️
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Rayon Surgelés
                  </h3>
                  <Badge variant="neutral" size="sm">+100 réf.</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Plus de 100 références à découvrir, avec en exclusivité les marques <strong>Hunkar</strong> et <strong>Idéal Délices</strong> pour vos plats, viandes et spécialités.
                </p>
              </div>
            </Card>

            {/* 4. Pâtisserie Orientale */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-amber-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                🍯
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Pâtisserie Orientale
                  </h3>
                  <Badge variant="brand" size="sm">Gourmandise</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Un assortiment raffiné de douceurs et pâtisseries orientales traditionnelles : cornes de gazelle, baklawas, makrouts et délices au miel pour tous vos moments de fête.
                </p>
              </div>
            </Card>

            {/* 5. Fruits & Légumes Frais */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-emerald-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                🥦
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Fruits &amp; Légumes Frais
                  </h3>
                  <Badge variant="neutral" size="sm">Primeur</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Arrivages réguliers de fruits savoureux et légumes de saison pour vous garantir fraîcheur, goût et vitamines au quotidien.
                </p>
              </div>
            </Card>

            {/* 6. Épicerie & Saveurs du Monde */}
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 border-[var(--color-border)] hover:border-orange-400/50 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-all pointer-events-none" />
              <div className="h-13 w-13 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                🥖
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Épicerie &amp; Produits Frais
                  </h3>
                  <Badge variant="neutral" size="sm">Du terroir</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Produits laitiers, conserves fines, épices du monde, riz, sauces, condiments et toutes vos marques indispensables du quotidien.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Calais Store Identity & Location Highlight Cards */}
        <section className="w-full space-y-6">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Informations Pratiques &amp; Localisation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Retrouvez toutes les coordonnées de notre établissement à Calais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Address Card */}
            <Card
              padded="lg"
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 transition-all duration-300 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
              <div className="space-y-3 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[var(--color-primary)] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Adresse Magasin
                  </span>
                  <h3 className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                    {STORE_DETAILS.address}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-medium mt-1">
                    {STORE_DETAILS.postalCode} Calais, Pas-de-Calais, France
                  </p>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] p-3 rounded-xl border border-[var(--color-border)]">
                  <span>GPS : 50.9465° N, 1.8974° E • Proche des grands axes et du centre-ville</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] relative z-10">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button variant="secondary" size="sm" fullWidth className="font-semibold gap-1.5 hover:border-[var(--color-primary)]/30 transition-colors">
                    <Navigation className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>Ouvrir sur Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)]" />
                  </Button>
                </a>
              </div>
            </Card>

            {/* Hours Card */}
            <Card
              padded="lg"
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
              <div className="space-y-3 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Horaires d&apos;Ouverture
                    </span>
                    <h3 className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                      Ouvert 7 jours sur 7
                    </h3>
                  </div>
                  <Badge variant={openStatus.isOpen ? "brand" : "secondary"} size="sm">
                    {openStatus.isOpen ? "Ouvert" : "Fermé"}
                  </Badge>
                </div>

                {/* Day-by-day list */}
                <div className="space-y-1.5 text-xs">
                  {STORE_DETAILS.schedule.map((slot) => {
                    const isToday = slot.dayIndex === currentDayIndex;
                    return (
                      <div
                        key={slot.day}
                        className={`flex items-center justify-between py-1 px-2.5 rounded-lg transition-colors ${
                          isToday
                            ? "bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />}
                          <span>{slot.day}</span>
                        </span>
                        <span className="font-mono">{slot.hours}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] text-center relative z-10">
                <span>Samedi &amp; Dimanche en continu toute la journée</span>
              </div>
            </Card>

            {/* Services & Contact Card */}
            <Card
              padded="lg"
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              <div className="space-y-3 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Services &amp; Contact
                  </span>
                  <h3 className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                    Alimentation &amp; Relais Colis
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-[var(--color-text)]">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]/60">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Point Relais Pickup &amp; Lockers</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Déposez et retirez vos colis La Poste, Chronopost &amp; partenaires en toute simplicité.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]/60">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Paiements multiples</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Cartes bancaires, sans contact, Apple Pay, Google Pay et espèces acceptés.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]/60">
                    <Gift className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Fidélité au comptoir</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        1 € = {appSettings.euroRatio} pt{appSettings.euroRatio > 1 ? "s" : ""} dès le 1er achat, pas de carte plastique requise.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] relative z-10">
                <a href={appSettings.store.phone ? `tel:${appSettings.store.phone.replace(/\s+/g, "")}` : STORE_DETAILS.phoneRaw} className="w-full block">
                  <Button variant="secondary" size="sm" fullWidth className="font-semibold gap-1.5 hover:border-emerald-500/30 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Appeler le magasin {appSettings.store.phone ? `(${appSettings.store.phone})` : ""}</span>
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Interactive Map & Access Banner */}
        <section className="w-full">
          <Card className="p-6 sm:p-8 rounded-[var(--radius-card,20px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Plan d&apos;accès à Calais</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
                  Comment venir à {appSettings.store.storeName} ?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Situé au {appSettings.store.address}, facilement accessible en voiture, transports en commun ou à pied.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="sm" className="font-bold gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Lancer le GPS</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
                <a
                  href={`https://waze.com/ul?ll=50.9465158,1.8973909&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="font-semibold gap-1.5 text-xs hover:bg-[var(--color-surface-hover)]">
                    <span>Waze</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Embedded Google Maps View */}
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-inner relative bg-[var(--color-surface-hover)]">
              <iframe
                title="Super Market Calais Carte Google Maps"
                src="https://maps.google.com/maps?q=Super+Market+205+Avenue+Antoine+de+Saint-Exup%C3%A9ry+Calais&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">📍 Repère :</span>
                <span>Quartier Saint-Exupéry, face aux commerces</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">🚌 Transports :</span>
                <span>Lignes Imag&apos;in Calais à 2 min à pied</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">🅿️ Stationnement :</span>
                <span>Places gratuites devant le magasin</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. Loyalty Program Spotlight */}
        <section className="w-full">
          <div className="rounded-[var(--radius-card,24px)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-hover)] to-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-12 shadow-sm text-left space-y-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Le Programme de Fidélité Sans Carte</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">
                Chaque euro dépensé à Calais vous rapporte des points.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Pas besoin de carte plastique dans votre portefeuille. Donnez simplement votre nom ou numéro de téléphone lors de votre passage en caisse.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
              <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all space-y-2.5">
                <div className="text-3xl font-black text-[var(--color-primary)]">1. Enregistrez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">Votre passage en caisse</h4>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Le caissier retrouve instantanément votre profil avec vos quelques lettres de nom ou votre portable.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all space-y-2.5">
                <div className="text-3xl font-black text-[var(--color-primary)]">2. Cumulez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">1 € = {appSettings.euroRatio} point{appSettings.euroRatio > 1 ? "s" : ""} fidélité</h4>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Vos points s&apos;accumulent automatiquement et débloquent des statuts Bronze, Silver, Gold et VIP.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all space-y-2.5">
                <div className="text-3xl font-black text-[var(--color-primary)]">3. Déduisez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">Remises directes sur le total</h4>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Consommez vos points en caisse pour obtenir une déduction immédiate sur le montant de vos courses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Account Access Banner */}
        <section className="w-full">
          <div className="w-full bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface-hover)] to-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,20px)] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-left shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--color-text)] tracking-tight">
                  Espace Fidélité &amp; Compte Client
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
                Consultez votre solde de points en temps réel, suivez vos passages en caisse et débloquez vos réductions exclusives en toute sérénité.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto relative z-10">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-[0_4px_16px_rgba(255,56,92,0.35)] hover:shadow-[0_6px_22px_rgba(255,56,92,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <span>Accéder à mon compte</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-[var(--color-border)] py-10 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shadow-xs overflow-hidden shrink-0">
                <Image src="/logo-hq.png" alt="Logo SuperMarket" width={48} height={48} className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-[var(--color-text)]">
                  {appSettings.store.storeName}
                </span>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {appSettings.store.address} • {appSettings.store.email} • {appSettings.store.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {appSettings.store.phone && (
                <a
                  href={`tel:${appSettings.store.phone.replace(/\s+/g, "")}`}
                  className="hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
                >
                  <span>{appSettings.store.phone}</span>
                </a>
              )}
              <Link href="/login" className="hover:text-[var(--color-text)] transition-colors">
                <span>Votre compte</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© {new Date().getFullYear()} {appSettings.store.storeName}. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <span>Du lundi au dimanche 7j/7</span>
              <span className="opacity-40">•</span>
              <span>Relais Pickup La Poste</span>
              <span className="opacity-40">•</span>
              <span>Fidélité 1€ = 1pt</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
