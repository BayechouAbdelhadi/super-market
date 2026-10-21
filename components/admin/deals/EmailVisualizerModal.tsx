"use client";

import React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { renderDealEmailHtml } from "@/lib/marketing/templates/deal-email";
import { X, Wifi } from "lucide-react";
import { getSiteUrl } from "@/lib/utils/app-url";

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
  subject,
  content,
  imageUrl,
  ctaText = "Découvrir les offres en magasin",
  ctaUrl = getSiteUrl(),
  storeName = "Super Market Calais",
  storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais",
  storePhone = "06 71 54 05 28",
  targetTiers = ["GOLD"],
}: EmailVisualizerModalProps) {
  if (!isOpen) return null;

  const previewTier: LoyaltyTier = targetTiers[0] || "GOLD";
  const customerName = "Marie Dupont";

  const rawHtml = renderDealEmailHtml({
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

  // Guarantee zero horizontal scrollbar inside the preview iframe
  const antiHorizontalScrollStyle = `
    <style>
      html, body {
        overflow-x: hidden !important;
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      * {
        box-sizing: border-box !important;
      }
      table {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    </style>
  `;

  const html = rawHtml.includes("<head>")
    ? rawHtml.replace("<head>", `<head>${antiHorizontalScrollStyle}`)
    : `${antiHorizontalScrollStyle}${rawHtml}`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        {/* Dark Dim Backdrop overlay */}
        <DialogOverlay className="fixed inset-0 isolate z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-200" />

        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none flex items-center justify-center p-0 max-h-[96vh] select-none"
        >
          {/* Smartphone Frame (Modal itself) */}
          <div className="relative w-[92vw] sm:w-[395px] max-w-[395px] bg-neutral-950 rounded-[36px] sm:rounded-[48px] p-2 sm:p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-neutral-700/80 ring-1 ring-white/10 flex flex-col shrink-0 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Top-Right Floating Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hardware buttons on phone edge (hidden on mobile to prevent overflow) */}
            <div className="hidden sm:block absolute -left-[7px] top-24 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
            <div className="hidden sm:block absolute -left-[7px] top-36 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
            <div className="hidden sm:block absolute -left-[7px] top-52 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
            <div className="hidden sm:block absolute -right-[7px] top-32 w-[3px] h-14 bg-neutral-700 rounded-r-sm" />

            {/* Status Bar */}
            <div className="bg-neutral-950 text-neutral-300 px-5 pt-2 pb-2 rounded-t-[36px] flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold text-white tracking-tight">10:00</span>

              {/* Center punch hole camera */}
              <div className="w-3.5 h-3.5 bg-black rounded-full border border-neutral-800 shadow-inner flex items-center justify-center">
                <div className="w-1 h-1 bg-neutral-900 rounded-full" />
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-sans font-bold text-white text-[10px]">5G</span>
                <Wifi className="w-3 h-3 text-neutral-300" />
                <div className="w-4 h-2 border border-neutral-400 rounded-[2px] p-0.5 flex items-center">
                  <div className="w-full h-full bg-white rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Phone Screen with strictly single vertical scroll (zero horizontal scroll) */}
            <div className="relative rounded-[32px] overflow-hidden overflow-x-hidden bg-white shadow-inner flex flex-col h-[70vh] max-h-[620px] min-h-[460px]">
              {/* App Top Bar */}
              <div className="bg-neutral-900 text-white px-3.5 py-2 flex items-center justify-between text-xs font-medium shrink-0 border-b border-neutral-800">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-400 font-bold">🛒</span>
                  <span className="truncate font-semibold tracking-wide text-xs">
                    {storeName}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                  Aperçu
                </span>
              </div>

              {/* Email Body Canvas */}
              <iframe
                title="Aperçu Email Client"
                // Email preview: no scripts, links open in a new tab
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={html}
                className="w-full h-full bg-white border-0 flex-1 overflow-x-hidden"
                style={{ overflowX: "hidden" }}
              />
            </div>

            {/* Bottom Chin with Simple Close Button */}
            <div className="pt-2.5 pb-1 px-3 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-700/80 shadow-xs active:scale-[0.98]"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
                <span>Fermer l&apos;aperçu</span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
