"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center p-1 shadow-2xs overflow-hidden">
              <Image src="/logo.jpeg" alt="SuperMarket Logo" width={32} height={32} priority className="h-full w-full object-cover rounded-[calc(var(--radius-button,12px)-4px)]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[var(--color-text)]">
                SuperMarket
              </span>
              <Badge variant="neutral" size="sm">
                Coming Soon
              </Badge>
            </div>
          </div>

          <div className="text-xs text-[var(--color-text-muted)] font-medium hidden sm:block">
            Ouverture prochaine de la boutique en ligne
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 max-w-5xl mx-auto w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] animate-in fade-in duration-300">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span>Nouvelle expérience en préparation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-text)] tracking-tight leading-[1.15]">
            Vos courses du quotidien,{" "}
            <span className="text-[var(--color-primary)]">bientôt en ligne.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-2xl mx-auto">
            Nous préparons une plateforme moderne, simple et rapide pour vos achats quotidiens.
            Retrouvez très bientôt l&apos;ensemble de nos rayons, nos produits frais et des
            services de retrait et livraison pensés pour vous simplifier la vie.
          </p>

          {/* Email Subscription Form */}
          <div className="pt-2 max-w-md mx-auto w-full">
            {subscribed ? (
              <div className="p-4 rounded-[var(--radius-button,12px)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm font-semibold text-[var(--color-primary)] animate-in fade-in duration-200 flex items-center justify-center gap-2">
                <span>✅</span>
                <span>Merci ! Vous serez informé en avant-première dès l&apos;ouverture.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email..."
                    className="w-full h-11 px-4 text-sm rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                  <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0 whitespace-nowrap">
                    Être informé
                  </Button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Soyez prévenu dès l&apos;ouverture officielle de notre service en ligne.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-6">
          <Card padded="lg" className="space-y-3">
            <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-xl">
              🌱
            </div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Produits Frais &amp; Locaux
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              Une sélection rigoureuse de produits frais, fruits, légumes et arrivages quotidiens sélectionnés pour leur qualité.
            </p>
          </Card>

          <Card padded="lg" className="space-y-3">
            <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-xl">
              🚗
            </div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Drive Express en 2h
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              Passez commande en quelques minutes et récupérez vos courses soigneusement préparées sans attente en magasin.
            </p>
          </Card>

          <Card padded="lg" className="space-y-3">
            <div className="h-10 w-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-xl">
              📦
            </div>
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Livraison Soignée
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              Un service de livraison respectant scrupuleusement la chaîne du froid, livré directement sur votre pas de porte.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-muted)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SuperMarket. Tous droits réservés.</p>
          <p className="text-[11px]">Plateforme e-commerce en cours de déploiement</p>
        </div>
      </footer>
    </div>
  );
}
