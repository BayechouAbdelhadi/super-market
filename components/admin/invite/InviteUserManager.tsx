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

  // 1. Isolated iframe print for printing exclusively the flyer
  const handlePrint = () => {
    const flyerElement = printableRef.current || document.getElementById("printable-qr-flyer");
    if (!flyerElement) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const headStyles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Affiche Fidélité - Super Market Calais</title>
          ${headStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm auto;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            body {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              min-height: 100vh !important;
              padding: 8mm 0 !important;
            }
            #printable-qr-flyer {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              max-width: 500px !important;
              margin: 0 auto !important;
              padding: 32px 28px !important;
              border: 2px solid #e2e8f0 !important;
              border-radius: 28px !important;
              box-shadow: none !important;
              background: linear-gradient(180deg, #fffdfa 0%, #ffffff 50%, #fff1f2 100%) !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div id="print-wrapper"></div>
        </body>
      </html>
    `);
    doc.close();

    const wrapper = doc.getElementById("print-wrapper");
    if (wrapper) {
      wrapper.appendChild(flyerElement.cloneNode(true));
    }

    const pri = iframe.contentWindow;
    if (!pri) return;

    const executePrint = () => {
      try {
        pri.focus();
        pri.print();
      } catch (err) {
        console.error("Print error:", err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    };

    const images = Array.from(doc.images);
    let loaded = 0;
    const total = images.length;

    if (total === 0) {
      setTimeout(executePrint, 200);
    } else {
      let isExecuted = false;
      const onImageLoaded = () => {
        loaded++;
        if (loaded >= total && !isExecuted) {
          isExecuted = true;
          setTimeout(executePrint, 150);
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          onImageLoaded();
        } else {
          img.onload = onImageLoaded;
          img.onerror = onImageLoaded;
        }
      });

      setTimeout(() => {
        if (!isExecuted) {
          isExecuted = true;
          executePrint();
        }
      }, 1000);
    }
  };

  // 2. High-resolution canvas export for flyer PNG download
  const handleDownloadWholeFlyer = async () => {
    if (!qrDataUrl) return;
    setIsExporting(true);
    try {
      toast.info("Génération de l'affiche marketing HD en cours...");
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1650;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Erreur d'initialisation graphique.");
        setIsExporting(false);
        return;
      }

      const drawRoundRect = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        if (typeof c.roundRect === "function") {
          c.roundRect(x, y, w, h, r);
        } else {
          c.rect(x, y, w, h);
        }
      };

      // 1. Warm alluring background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "#fffbf5");
      bgGrad.addColorStop(0.5, "#ffffff");
      bgGrad.addColorStop(1, "#fff1f2");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Outer decorative borders
      ctx.strokeStyle = "#fed7aa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      drawRoundRect(ctx, 36, 36, canvas.width - 72, canvas.height - 72, 36);
      ctx.stroke();

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      drawRoundRect(ctx, 48, 48, canvas.width - 96, canvas.height - 96, 30);
      ctx.stroke();

      // 3. Logo
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/logo-hq.png";
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
      });

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 150, 64, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, 536, 86, 128, 128);
        ctx.restore();

        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(600, 150, 64, 0, Math.PI * 2, true);
        ctx.stroke();
      }

      // 4. Store Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 52px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SUPER MARKET CALAIS", 600, 260);

      // 5. Badge: Club Fidélité Magasin
      ctx.fillStyle = "#e11d48";
      const badgeW = 460;
      const badgeH = 50;
      const badgeX = 600 - badgeW / 2;
      const badgeY = 285;
      ctx.beginPath();
      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 25);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("✦  CLUB FIDÉLITÉ OFFICIEL  ✦", 600, 318);

      // 6. Magnetic Catchy Headline
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 48px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("ÉCONOMISEZ SUR VOS COURSES !", 600, 400);

      ctx.fillStyle = "#475569";
      ctx.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Scannez ce QR Code et activez votre cagnotte en 30 secondes en caisse", 600, 445);

      // 7. QR Code Frame & Label
      const qrFrameW = 580;
      const qrFrameH = 620;
      const qrFrameX = 600 - qrFrameW / 2;
      const qrFrameY = 485;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      drawRoundRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, 32);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Top label inside QR card
      ctx.fillStyle = "#fff1f2";
      ctx.beginPath();
      drawRoundRect(ctx, qrFrameX + 40, qrFrameY + 20, qrFrameW - 80, 44, 22);
      ctx.fill();

      ctx.fillStyle = "#e11d48";
      ctx.font = "bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("📲  POINTEZ L'APPAREIL PHOTO DE VOTRE TÉLÉPHONE", 600, qrFrameY + 49);

      // QR Image
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });

      ctx.drawImage(qrImg, 340, qrFrameY + 80, 520, 520);

      // 8. Three Advantage Cards
      const cardY = 1145;
      const cardH = 145;
      const cardW = 340;

      // Advantage 1: 1€ = 1 Pt
      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      drawRoundRect(ctx, 80, cardY, cardW, cardH, 20);
      ctx.fill();
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#b45309";
      ctx.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("1 € = 1 Point", 250, cardY + 55);
      ctx.fillStyle = "#78350f";
      ctx.font = "500 19px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Cagnottez sur chaque ticket", 250, cardY + 95);

      // Advantage 2: Remises directes
      ctx.fillStyle = "#f0fdf4";
      ctx.beginPath();
      drawRoundRect(ctx, 430, cardY, cardW, cardH, 20);
      ctx.fill();
      ctx.strokeStyle = "#bbf7d0";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#15803d";
      ctx.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Remises en Caisse", 600, cardY + 55);
      ctx.fillStyle = "#14532d";
      ctx.font = "500 19px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Déduisez vos points en euros", 600, cardY + 95);

      // Advantage 3: Bons plans
      ctx.fillStyle = "#fff1f2";
      ctx.beginPath();
      drawRoundRect(ctx, 780, cardY, cardW, cardH, 20);
      ctx.fill();
      ctx.strokeStyle = "#fecdd3";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#be123c";
      ctx.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Offres Exclusives", 950, cardY + 55);
      ctx.fillStyle = "#9f1239";
      ctx.font = "500 19px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Promos réservées au Club", 950, cardY + 95);

      // 9. Reassurance Banner
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      drawRoundRect(ctx, 160, 1330, 880, 56, 28);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("✓  100% GRATUIT  ·  SANS CARTE BANCAIRE  ·  VALABLE IMMÉDIATEMENT", 600, 1365);

      // 10. Store Address, URL & Friendly Sign-off
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 1425);
      ctx.lineTo(1060, 1425);
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("205 Avenue Antoine de Saint-Exupéry, 62100 Calais", 600, 1475);

      ctx.fillStyle = "#e11d48";
      ctx.font = "600 22px monospace";
      ctx.fillText(publicInviteUrl, 600, 1515);

      ctx.fillStyle = "#64748b";
      ctx.font = "italic 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("« Votre supermarché de quartier toujours à vos côtés ! »", 600, 1560);

      const link = document.createElement("a");
      link.download = "affiche-fidelite-supermarket-calais.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Affiche marketing complète téléchargée avec succès (PNG HD) !");
    } catch (err) {
      console.error("Flyer export error:", err);
      toast.error("Erreur lors de la création de l'image de l'affiche.");
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Download standalone QR code image
  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "supermarket-calais-qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image du QR Code seul téléchargée !");
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

          {/* THE ENHANCED ALLURING POSTER */}
          <div
            id="printable-qr-flyer"
            ref={printableRef}
            className="w-full max-w-md rounded-3xl border-2 border-rose-200/90 p-6 sm:p-7 text-center shadow-xl shadow-rose-950/5 space-y-4 relative overflow-hidden bg-gradient-to-b from-[#fffdfa] via-white to-[#fff1f2]"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600" />

            {/* Header Brand */}
            <div className="flex flex-col items-center pt-1">
              <div className="h-16 w-16 rounded-full bg-white border-2 border-rose-200 p-1 flex items-center justify-center mb-2 overflow-hidden shadow-xs ring-4 ring-rose-50">
                <Image
                  src="/logo-hq.png"
                  alt="SuperMarket Logo"
                  width={64}
                  height={64}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Super Market Calais
              </h2>

              {/* Punchy badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider mt-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Club Fidélité Officiel
              </div>
            </div>

            {/* Magnetic Catchy Headline */}
            <div className="space-y-1 pt-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                Économisez sur vos courses !
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs mx-auto">
                Scannez ce QR Code et activez votre cagnotte en 30 secondes en caisse.
              </p>
            </div>

            {/* Crisp Focal QR Code Container */}
            <div className="flex justify-center my-2">
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-md inline-block relative group">
                {/* Scan hint pill */}
                <div className="mb-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center justify-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-rose-500" />
                  <span>Pointez votre smartphone</span>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Code QR d'invitation"
                    className="w-44 h-44 sm:w-52 sm:h-52 object-contain mx-auto block"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400 text-xs font-mono">
                    Génération du code...
                  </div>
                )}

                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  ✦ Inscription instantanée ✦
                </div>
              </div>
            </div>

            {/* Three Marketing Benefit Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-rose-100 text-left">
              {/* Perk 1 */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex flex-col items-center text-center">
                <div className="p-1 rounded-md bg-amber-100 text-amber-700 mb-1">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] sm:text-xs font-black text-slate-900">1 € = 1 Pt</div>
                <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 leading-tight">À chaque passage</div>
              </div>

              {/* Perk 2 */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex flex-col items-center text-center">
                <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 mb-1">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] sm:text-xs font-black text-emerald-800">Remises</div>
                <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 leading-tight">Déduites en caisse</div>
              </div>

              {/* Perk 3 */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/70 flex flex-col items-center text-center">
                <div className="p-1 rounded-md bg-rose-100 text-rose-700 mb-1">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] sm:text-xs font-black text-rose-700">Bons plans</div>
                <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 leading-tight">Offres exclusives</div>
              </div>
            </div>

            {/* Reassurance Ribbon */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Gratuit · Sans carte bancaire · Immédiat</span>
            </div>

            {/* Store Address & URL Footer */}
            <div className="pt-2 text-[10px] sm:text-[11px] text-slate-500 border-t border-rose-100 space-y-0.5">
              <div className="font-bold text-slate-900">
                205 Avenue Antoine de Saint-Exupéry, 62100 Calais
              </div>
              <div className="text-[10px] text-rose-600 font-mono truncate font-semibold">
                {publicInviteUrl}
              </div>
              <div className="text-[10px] text-slate-400 italic pt-0.5">
                « Votre supermarché de quartier toujours à vos côtés »
              </div>
            </div>
          </div>
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
