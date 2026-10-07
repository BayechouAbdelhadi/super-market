"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col font-sans selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-text)]">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-[var(--radius-button,12px)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden shrink-0">
              <Image
                src="/logo.jpeg"
                alt="SuperMarket Logo"
                width={36}
                height={36}
                priority
                className="h-full w-full object-cover rounded-[calc(var(--radius-button,12px)-4px)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[var(--color-text)]">
                  SuperMarket
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Magasin Ouvert
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
                Produits frais de saison • Programme fidélité au comptoir
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link href="/cashier">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs font-semibold gap-1.5 hover:border-[var(--color-primary)]/40"
              >
                <span>🛒</span>
                <span className="hidden sm:inline">Espace</span> Caisse
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
              >
                <span>Connexion</span>
                <span className="hidden md:inline">Staff</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto w-full text-center space-y-16">
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl mx-auto pt-4">
          {/* Ambient badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in duration-300">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[var(--color-text)] font-bold">Nouveau en magasin</span>
            <span className="opacity-40">•</span>
            <span>1 € dépensé = 1 point fidélité</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-text)] tracking-tight leading-[1.12]">
            Vos courses du quotidien,{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">
              sublimées par la fidélité.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl mx-auto font-normal">
            Retrouvez tous vos produits frais préférés en magasin, cumulez des points à chaque passage en caisse et profitez de remises directes sans carte plastique encombrante.
          </p>

          {/* Email Subscription Card */}
          <div className="pt-2 max-w-lg mx-auto w-full">
            {subscribed ? (
              <div className="p-4 rounded-[var(--radius-button,12px)] bg-emerald-500/10 border border-emerald-500/25 text-sm font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200 flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(16,185,129,0.1)]">
                <span className="text-lg">✅</span>
                <span>Merci ! Vous recevrez nos offres exclusives en avant-première.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-[calc(var(--radius-input,12px)+4px)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_4px_14px_rgba(0,0,0,0.05)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/15 transition-all">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email pour les offres..."
                    className="w-full h-11 px-4 text-sm bg-transparent text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto shrink-0 whitespace-nowrap shadow-[0_2px_8px_rgba(255,56,92,0.25)] font-bold"
                  >
                    M&apos;informer des remises
                  </Button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Déjà +2 450 clients fidélisés dans notre supermarché de quartier.
                </p>
              </form>
            )}
          </div>

          {/* Key Metrics Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[var(--color-text-muted)]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs font-medium">
              <span>🍏</span>
              <span>Rayon frais réapprovisionné à 6h</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs font-medium">
              <span>🎟️</span>
              <span>1 € = 1 point en caisse</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs font-medium">
              <span>👑</span>
              <span>Statuts Bronze, Silver, Gold &amp; VIP</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Airbnb Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-2">
          <Card
            padded="lg"
            className="space-y-4 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 border-[var(--color-border)] group"
          >
            <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🥦
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                  Rayon Frais &amp; Terroir
                </h2>
                <Badge variant="neutral" size="sm">Frais du jour</Badge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Fruits et légumes cueillis à maturité, boucherie traditionnelle et produits laitiers en circuit court auprès de maraîchers régionaux.
              </p>
            </div>
          </Card>

          <Card
            padded="lg"
            className="space-y-4 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 border-[var(--color-border)] group"
          >
            <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🎟️
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                  Fidélité au Numéro de Tél
                </h2>
                <Badge variant="brand" size="sm">Sans carte</Badge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Plus besoin d&apos;accumuler des cartes plastiques. Donnez simplement votre prénom ou numéro en caisse pour créditer ou déduire vos points.
              </p>
            </div>
          </Card>

          <Card
            padded="lg"
            className="space-y-4 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 border-[var(--color-border)] group"
          >
            <div className="h-12 w-12 rounded-[var(--radius-button,12px)] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                  Remises Immédiates en Caisse
                </h2>
                <Badge variant="neutral" size="sm">Économies directes</Badge>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Utilisez votre solde de points disponible directement au comptoir pour réduire le montant de vos tickets de caisse en un clic.
              </p>
            </div>
          </Card>
        </div>

        {/* Staff / Cashier Banner CTA */}
        <div className="w-full bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface-hover)] to-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                Accès Opérateurs &amp; Caissiers
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl">
              Vous faites partie de l&apos;équipe SuperMarket ? Accédez au terminal de caisse pour enregistrer les achats, gérer le barème de points et retrouver vos clients au comptoir.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link href="/cashier" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto font-bold gap-2">
                <span>Ouvrir l&apos;espace caisse</span>
                <span>→</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-0.5 overflow-hidden">
              <Image src="/logo.jpeg" alt="Logo" width={24} height={24} className="h-full w-full object-cover rounded-md" />
            </div>
            <p>© 2026 SuperMarket. Tous droits réservés.</p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Horaires : Lun - Sam (8h30 - 20h00)</span>
            <span className="opacity-40">•</span>
            <span>Dimanche (9h00 - 13h00)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
