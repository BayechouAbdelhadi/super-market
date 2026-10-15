"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { renderDealEmailHtml } from "@/lib/marketing/templates/deal-email";
import {
  Smartphone,
  Monitor,
  Eye,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Store,
} from "lucide-react";

interface EmailVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subject: string;
  content: string;
  imageUrl?: string | null;
  ctaText?: string;
  ctaUrl?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  targetTiers?: LoyaltyTier[];
}

export function EmailVisualizerModal({
  isOpen,
  onClose,
  title,
  subject,
  content,
  imageUrl,
  ctaText = "Découvrir les offres en magasin",
  ctaUrl = "https://supermarket-calais.fr",
  storeName = "Super Market Calais",
  storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  storePhone = "06 71 54 05 28",
  targetTiers = ["GOLD"],
}: EmailVisualizerModalProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [previewTier, setPreviewTier] = useState<LoyaltyTier>(
    targetTiers[0] || "GOLD"
  );
  const [customerName, setCustomerName] = useState("Marie Dupont");

  if (!isOpen) return null;

  const html = renderDealEmailHtml({
    customerName,
    tier: previewTier,
    subject: subject || "Bons plans exclusifs fidélité",
    content:
      content ||
      "Profitez de nos offres exceptionnelles dès aujourd'hui dans votre magasin.",
    imageUrl,
    ctaText,
    ctaUrl,
    storeName,
    storeAddress,
    storePhone,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visualiser l'e-mail (Aperçu consommateur)"
      icon="👁️"
      description="Découvrez exactement ce que les consommateurs recevront dans leur boîte mail (sur Mobile & Ordinateur)."
      maxWidth="lg"
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Visualizer Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
          {/* Tier Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Palier client :
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
              {(["BRONZE", "SILVER", "GOLD", "VIP"] as LoyaltyTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPreviewTier(t)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    previewTier === t
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Device Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Affichage :
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
              <button
                type="button"
                onClick={() => setDeviceView("desktop")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deviceView === "desktop"
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-text)] font-bold shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Ordinateur</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deviceView === "mobile"
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-text)] font-bold shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (iPhone / Android)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Realistic Webmail Envelope Header */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-text)]">De :</span>
              <span className="text-[var(--color-text)] font-medium">
                {storeName} &lt;abdelbayechou@gmail.com&gt;
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Expéditeur vérifié Brevo</span>
              </span>
            </div>
            <span className="text-[var(--color-text-muted)] hidden sm:inline">
              Aujourd&apos;hui (Heure de Paris)
            </span>
          </div>

          <div className="flex items-center gap-2 border-b border-[var(--color-border)]/70 pb-2">
            <span className="font-bold text-[var(--color-text)]">À :</span>
            <span className="text-[var(--color-text)]">
              {customerName} &lt;client.fidelite@exemple.fr&gt;
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              ({previewTier})
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="font-bold text-[var(--color-text)]">Objet :</span>
            <strong className="text-[var(--color-primary)] font-bold text-sm">
              {subject || "(Sans objet)"}
            </strong>
          </div>
        </div>

        {/* Email Canvas Preview */}
        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner flex justify-center p-3 sm:p-6 min-h-[500px]">
          <div
            className={`transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-[var(--color-border)] bg-white ${
              deviceView === "mobile"
                ? "w-[375px] max-w-full ring-8 ring-slate-800"
                : "w-full max-w-[620px]"
            }`}
          >
            {deviceView === "mobile" && (
              <div className="bg-slate-800 text-white text-[10px] py-1 px-4 flex justify-between items-center font-mono">
                <span>09:41</span>
                <span className="text-[9px] tracking-widest">●●● 5G</span>
              </div>
            )}
            <iframe
              title="Aperçu Email Client"
              srcDoc={html}
              className="w-full h-[580px] bg-white border-0"
            />
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            ✨ Design responsive certifié pour Gmail, Apple Mail, Outlook et Yahoo.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Fermer l&apos;aperçu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
