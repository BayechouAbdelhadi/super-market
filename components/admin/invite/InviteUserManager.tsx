"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  QrCode,
  Printer,
  Copy,
  Check,
  FileImage,
  ExternalLink,
  Sparkles,
  Store,
  Layers,
  Coins,
  Gift,
  Tag,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { FidelityPoster } from "./FidelityPoster";
import {
  drawFidelityFlyerOnCanvas,
  downloadCanvasAsPng,
  printFidelityFlyer,
} from "./exportFlyerCanvas";

export function InviteUserManager() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const publicInviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite`
      : "https://supermarket-calais.fr/invite";

  // Generate ultra-crisp QR Code for the public invite URL
  useEffect(() => {
    if (publicInviteUrl) {
      QRCode.toDataURL(publicInviteUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error("Failed to generate QR Code:", err);
          toast.error("Impossible de générer le QR Code.");
        });
    }
  }, [publicInviteUrl]);

  // 1. Impression haute définition format A4 / A5 (ou Enregistrer au format PDF)
  const handlePrint = async () => {
    try {
      toast.info("Préparation de l'affiche pour impression...");
      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(publicInviteUrl, {
          width: 800,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(activeQr);
      }

      await printFidelityFlyer(activeQr, publicInviteUrl);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Erreur lors de la préparation de l'impression.");
    }
  };

  // 2. High-resolution canvas export for flyer PNG download
  const handleDownloadWholeFlyer = async () => {
    setIsExporting(true);
    try {
      toast.info("Génération de l'affiche marketing HD en cours...");

      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(publicInviteUrl, {
          width: 800,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(activeQr);
      }

      const canvas = document.createElement("canvas");
      await drawFidelityFlyerOnCanvas(canvas, activeQr, publicInviteUrl, {
        storeName: "Super Market",
        storeAddress: "205 avenue Antoine saint exupery",
        siteUrl: "Supermarketcalais.com",
      });

      await downloadCanvasAsPng(canvas, "affiche-fidelite-supermarket-calais.png");
      toast.success("Affiche marketing complète téléchargée avec succès (PNG HD) !");
    } catch (err) {
      console.error("Flyer export error:", err);
      toast.error("Erreur lors de la création de l'image de l'affiche.");
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Download standalone QR code image
  const handleDownloadQrOnly = async () => {
    try {
      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(publicInviteUrl, {
          width: 800,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(activeQr);
      }

      const a = document.createElement("a");
      a.href = activeQr;
      a.download = "supermarket-calais-qrcode.png";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
      toast.success("Image du QR Code seul téléchargée !");
    } catch (err) {
      console.error("QR download error:", err);
      toast.error("Erreur lors du téléchargement du QR Code.");
    }
  };

  // 4. Copy URL
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien copié dans le presse-papiers !");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-rose-600" />
            Affiche Magasin &amp; QR Code
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Affiche officielle ultra-attractive pour vos comptoirs de caisse et vitrines. Vos clients scannent et adhèrent au club en 30 secondes chrono.
          </p>
        </div>

        {/* Quick Print CTA button */}
        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer border border-slate-800 group"
          title="Imprimer l'Affiche Magasin (A4 / A5)"
        >
          <Printer className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
          <span>Imprimer l&apos;affiche</span>
        </button>
      </div>

      {/* Main 2-Column Layout: Left = Stunning Poster Preview, Right = Actions & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Alluring Flyer Preview */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Aperçu de l&apos;affiche officielle (Format A4 / A5)
            </span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Prêt pour impression
            </span>
          </div>

          {/* THE ENHANCED ALLURING POSTER (Recreated from template -fidility-card.jpeg) */}
          <FidelityPoster
            ref={printableRef}
            qrDataUrl={qrDataUrl}
            finalUrl={publicInviteUrl}
            storeName="Super Market"
            storeAddress="205 avenue Antoine saint exupery"
            siteUrl="Supermarketcalais.com"
          />
        </div>

        {/* Right Column: Actions, Link & Shop Instructions */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Print & Export Actions */}
          <Card className="p-6 border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Printer className="w-5 h-5" />
              </div>
              Impression &amp; Téléchargements Haute Définition
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Imprimez directement l&apos;affiche sur votre imprimante de caisse (A4/A5) ou exportez les visuels pour votre imprimerie ou vos supports digitaux :
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Primary Action: Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-rose-400" />
                <span>Imprimer l&apos;affiche (Format A4 / A5)</span>
              </button>

              {/* Secondary Actions: Download Poster & Download QR Only */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadWholeFlyer}
                  className="h-11 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all text-slate-800 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileImage className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">
                    {isExporting ? "Création..." : "Télécharger l'affiche (PNG HD)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrOnly}
                  className="h-11 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all text-slate-800 cursor-pointer shadow-xs"
                >
                  <QrCode className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Télécharger QR Code seul</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Card 2: Permanent Public Invite Link */}
          <Card className="p-6 border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Store className="w-5 h-5" />
              </div>
              Lien public d&apos;adhésion client
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ce lien permanent permet à vos clients d&apos;adhérer au club fidélité depuis leur smartphone ou les réseaux sociaux :
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicInviteUrl}
                  className="flex-1 min-w-0 h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 truncate"
                />

                <button
                  type="button"
                  onClick={() => copyToClipboard(publicInviteUrl)}
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Copier le lien d'invitation"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-600 font-bold">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Lien actif 24h/24
                </span>
                <Link
                  href="/invite"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <span>Tester la page client</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </Card>

          {/* Card 3: Best Practices for In-Store Deployment */}
          <Card className="p-6 border-slate-200/90 shadow-sm space-y-3 bg-slate-50/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-slate-500" />
              Recommandations d&apos;installation en magasin
            </div>

            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-[11px] flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Comptoirs de caisse :</strong> Placez le flyer sous chevalet plexiglas directement à portée de vue du client pendant la saisie des articles.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-[11px] flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900">Entrée du magasin &amp; vitrines :</strong> Affichez le format A4 à l&apos;entrée pour informer les nouveaux clients dès leur arrivée.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-[11px] flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900">Tickets &amp; réseaux sociaux :</strong> Utilisez l&apos;option « Télécharger QR Code seul » pour intégrer le code sur vos tickets ou publications Facebook/Instagram.
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
