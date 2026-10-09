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
  const currentDayIndex = new Date().getDay();

  useEffect(() => {
    setOpenStatus(getIsOpenNow());
    const interval = setInterval(() => {
      setOpenStatus(getIsOpenNow());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--color-background)] text-[var(--color-text)] font-sans selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-text)]">
      {/* Top Fixed Header Shell */}
      <div className="shrink-0 z-40">
        {/* Top Banner Notice */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] via-rose-600 to-[var(--color-primary)] text-white text-xs py-2 px-4 text-center font-medium shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 flex-wrap">
            <span className="font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
              Calais Saint-Exupéry
            </span>
            <span>Votre supermarché de quartier ouvert 7j/7 avec primeur frais et point relais Pickup !</span>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:text-white/90 inline-flex items-center gap-1 ml-1"
            >
              <span>Voir sur Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Main Header */}
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-0.5 shadow-md overflow-hidden shrink-0">
              <Image
                src="/logo-hq.png"
                alt="SuperMarket Calais Logo"
                width={60}
                height={60}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-[var(--color-text)]">
                  Super Market
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  Calais
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    openStatus.isOpen
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
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
              <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
                205 Avenue Antoine de Saint-Exupéry • 62100 Calais
              </p>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={STORE_DETAILS.phoneRaw}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{STORE_DETAILS.phone}</span>
            </a>

            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold shadow-[0_2px_8px_rgba(255,56,92,0.25)] h-9 gap-1.5"
              >
                <span>Votre compte</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      </div>

      {/* Main Scrollable Viewport Container (§ 25.1) */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {/* Full-width 100% Super Market Calais Storefront Banner on Top of the Site */}
        <section className="w-full relative shrink-0 aspect-[16/7] sm:aspect-[21/8] md:aspect-[24/8] max-h-[460px] min-h-[220px] bg-neutral-900 border-b border-[var(--color-border)] overflow-hidden group">
          <Image
            src="/super-market-calais-enhanced.jpg"
            alt="Super Market Calais — Magasin & Devanture au 205 Avenue Antoine de Saint-Exupéry"
            fill
            priority
            className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 flex flex-col justify-end p-4 sm:p-8 md:p-10 text-white">
            <div className="max-w-6xl mx-auto w-full space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-bold text-white w-fit shadow-sm">
                <Store className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Super Market Calais • 205 Avenue Antoine de Saint-Exupéry</span>
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                Votre magasin de proximité &amp; primeur frais à Calais
              </h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-neutral-200 font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ouvert 7j/7</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Surface +300 m²</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Primeur &amp; Dépôt de pain</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Relais Pickup La Poste</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 max-w-6xl mx-auto w-full space-y-16">
        {/* 1. Hero Section */}
        <section className="space-y-6 max-w-3xl mx-auto text-center pt-2">
          {/* Ambient live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <span
              className={`h-2 w-2 rounded-full ${
                openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-[var(--color-text)] font-bold">{openStatus.statusText}</span>
            <span className="opacity-40">•</span>
            <span>Ouvert 7 jours sur 7</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-text)] tracking-tight leading-[1.12]">
            Votre supermarché de quartier à{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-rose-500 to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              Calais Saint-Exupéry.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl mx-auto font-normal">
            Alimentation générale de proximité, fruits et légumes frais réapprovisionnés quotidiennement, point relais colis Pickup La Poste et programme fidélité au comptoir (1 € = 1 point).
          </p>

          {/* Quick action buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="lg"
                className="font-bold gap-2 shadow-[0_4px_14px_rgba(255,56,92,0.3)]"
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
                className="font-semibold gap-2 border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Appeler le {STORE_DETAILS.phone}</span>
              </Button>
            </a>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="font-semibold gap-2"
              >
                <Store className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Votre compte</span>
              </Button>
            </Link>
          </div>
        </section>


        {/* 2. Calais Store Identity & Location Highlight Cards */}
        <section className="w-full space-y-6">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Informations Pratiques &amp; Localisation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Retrouvez toutes les coordonnées de notre établissement à Calais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Address Card */}
            <Card
              padded="lg"
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[var(--color-primary)] flex items-center justify-center">
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
                <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] p-2.5 rounded-lg border border-[var(--color-border)]">
                  <span>GPS : 50.9465° N, 1.8974° E • Proche des grands axes et du centre-ville</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="secondary" size="sm" fullWidth className="font-semibold gap-1.5">
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
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
                  <Badge variant={openStatus.isOpen ? "neutral" : "secondary"} size="sm">
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
                        className={`flex items-center justify-between py-1 px-2 rounded-md ${
                          isToday
                            ? "bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />}
                          <span>{slot.day}</span>
                        </span>
                        <span className="font-mono">{slot.hours}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] text-center">
                <span>Samedi &amp; Dimanche en continu toute la journée</span>
              </div>
            </Card>

            {/* Services & Contact Card */}
            <Card
              padded="lg"
              className="flex flex-col justify-between space-y-4 border-[var(--color-border)] hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--color-surface-hover)]">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Point Relais Pickup &amp; Lockers</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Déposez et retirez vos colis La Poste, Chronopost &amp; partenaires en toute simplicité.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--color-surface-hover)]">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Paiements multiples</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Cartes bancaires, sans contact, Apple Pay, Google Pay et espèces acceptés.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--color-surface-hover)]">
                    <Gift className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[var(--color-text)]">Fidélité au comptoir</strong>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        1 € = 1 pt dès le 1er achat, pas de carte plastique requise.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]">
                <a href={STORE_DETAILS.phoneRaw} className="w-full">
                  <Button variant="secondary" size="sm" fullWidth className="font-semibold gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Appeler le magasin</span>
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Interactive Map & Access Banner */}
        <section className="w-full">
          <Card className="p-6 sm:p-8 rounded-[var(--radius-card,20px)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Plan d&apos;accès à Calais</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
                  Comment venir à Super Market Calais ?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Situé sur l&apos;Avenue Antoine de Saint-Exupéry, facilement accessible en voiture, transports en commun ou à pied.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="sm" className="font-bold gap-2">
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
                  <Button variant="outline" size="sm" className="font-semibold gap-1.5 text-xs">
                    <span>Waze</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Embedded Google Maps View */}
            <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-inner relative bg-[var(--color-surface-hover)]">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">📍 Adresse :</span>
                <span>205 Av. Saint-Exupéry, Calais</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">📞 Téléphone :</span>
                <a href={STORE_DETAILS.phoneRaw} className="text-[var(--color-primary)] hover:underline font-mono">
                  {STORE_DETAILS.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-text)]">🅿️ Stationnement :</span>
                <span>Places disponibles à proximité</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. Products & Departments Feature Cards */}
        <section className="w-full space-y-6">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Nos Rayons &amp; Produits Frais
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Une sélection rigoureuse pour régaler toute la famille au meilleur prix
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1 hover:shadow-md transition-all border-[var(--color-border)] group"
            >
              <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🥦
              </div>
              <div className="space-y-1.5">
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

            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1 hover:shadow-md transition-all border-[var(--color-border)] group"
            >
              <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🥖
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Épicerie &amp; Produits Frais
                  </h3>
                  <Badge variant="brand" size="sm">Du terroir</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Produits laitiers, charcuterie, conserves fines, pâtes, sauces, condiments et toutes vos marques indispensables du quotidien.
                </p>
              </div>
            </Card>

            <Card
              padded="lg"
              className="space-y-4 hover:-translate-y-1 hover:shadow-md transition-all border-[var(--color-border)] group"
            >
              <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🥤
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    Boissons &amp; Fraîcheur
                  </h3>
                  <Badge variant="neutral" size="sm">Large choix</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Jus de fruits naturels, eaux minérales, sodas, boissons fraîches prêtes à consommer et douceurs sucrées pour vos pauses.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* 5. Loyalty Program Spotlight */}
        <section className="w-full">
          <div className="rounded-[var(--radius-card,20px)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-hover)] to-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-10 shadow-sm text-left space-y-8">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-bold uppercase tracking-wider">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                <div className="text-2xl font-black text-[var(--color-primary)]">1. Enregistrez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">Votre passage en caisse</h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Le caissier retrouve instantanément votre profil avec vos quelques lettres de nom ou votre portable.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                <div className="text-2xl font-black text-[var(--color-primary)]">2. Cumulez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">1 € = 1 point fidélité</h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Vos points s&apos;accumulent automatiquement et débloquent des statuts Bronze, Silver, Gold et VIP.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                <div className="text-2xl font-black text-[var(--color-primary)]">3. Déduisez</div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">Remises directes sur le total</h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Consommez vos points en caisse pour obtenir une déduction immédiate sur le montant de vos courses.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* 6. Account Access Banner */}
        <section className="w-full">
          <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                  Votre compte
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl">
                Accédez à votre espace pour gérer vos informations et vos services en toute simplicité.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto font-bold gap-2">
                  <span>Se connecter</span>
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
                  Super Market Calais
                </span>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  205 Avenue Antoine de Saint-Exupéry, 62100 Calais • SIRET : {STORE_DETAILS.siret}
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
              <a
                href={STORE_DETAILS.phoneRaw}
                className="hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
              >
                <span>{STORE_DETAILS.phone}</span>
              </a>
              <Link href="/login" className="hover:text-[var(--color-text)] transition-colors">
                <span>Votre compte</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© 2026 Super Market Calais. Tous droits réservés.</p>
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
