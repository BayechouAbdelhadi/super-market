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

  // Generate crisp QR Code for the public invite URL
  useEffect(() => {
    if (publicInviteUrl) {
      QRCode.toDataURL(publicInviteUrl, {
        width: 700,
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
              margin: 15mm auto;
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
              padding: 10mm 0 !important;
            }
            #printable-qr-flyer {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              max-width: 480px !important;
              margin: 0 auto !important;
              padding: 28px 24px !important;
              border: 1.5px solid #cbd5e1 !important;
              border-radius: 24px !important;
              box-shadow: none !important;
              background: #ffffff !important;
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
      toast.info("Génération de l'affiche en haute résolution...");
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
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

      // 1. Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Outer decorative border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      drawRoundRect(ctx, 36, 36, canvas.width - 72, canvas.height - 72, 32);
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
        ctx.arc(600, 160, 60, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, 540, 100, 120, 120);
        ctx.restore();

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(600, 160, 60, 0, Math.PI * 2, true);
        ctx.stroke();
      }

      // 4. Store Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 52px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SUPER MARKET CALAIS", 600, 275);

      // 5. Badge: Programme Fidélité Magasin
      ctx.fillStyle = "#ffe4e6";
      const badgeW = 440;
      const badgeH = 48;
      const badgeX = 600 - badgeW / 2;
      const badgeY = 305;
      ctx.beginPath();
      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 24);
      ctx.fill();
      ctx.strokeStyle = "#fecdd3";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#be123c";
      ctx.font = "bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("✦  PROGRAMME FIDÉLITÉ MAGASIN  ✦", 600, 336);

      // 6. Header Text
      ctx.fillStyle = "#0f172a";
      ctx.font = "800 42px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Créez votre compte fidélité en 30s !", 600, 420);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Scannez ce code avec l'appareil photo de votre smartphone", 600, 465);

      // 7. QR Code Frame & Image
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      drawRoundRect(ctx, 310, 520, 580, 580, 32);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.drawImage(qrImg, 330, 540, 540, 540);

      // 8. Perks (2 Cards)
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      drawRoundRect(ctx, 140, 1160, 440, 150, 24);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Cumul de points", 360, 1225);
      ctx.fillStyle = "#64748b";
      ctx.font = "500 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("À chaque passage en caisse", 360, 1270);

      ctx.fillStyle = "#fff1f2";
      ctx.beginPath();
      drawRoundRect(ctx, 620, 1160, 440, 150, 24);
      ctx.fill();
      ctx.strokeStyle = "#fecdd3";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#e11d48";
      ctx.font = "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Promos exclusives", 840, 1225);
      ctx.fillStyle = "#64748b";
      ctx.font = "500 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Réception d'offres réservées", 840, 1270);

      // 9. Divider
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 1370);
      ctx.lineTo(1060, 1370);
      ctx.stroke();

      // 10. Store Address & URL
      ctx.fillStyle = "#1e293b";
      ctx.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("205 Avenue Antoine de Saint-Exupéry, 62100 Calais", 600, 1425);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 20px monospace";
      ctx.fillText(publicInviteUrl, 600, 1465);

      const link = document.createElement("a");
      link.download = "affiche-fidelite-supermarket-calais.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Affiche complète téléchargée avec succès (PNG HD) !");
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
            Générez, imprimez et téléchargez l&apos;affiche officielle du magasin. Vos clients n&apos;ont qu&apos;à scanner ce code en caisse pour créer leur compte fidélité en 30 secondes.
          </p>
        </div>

        {/* Quick Print CTA button */}
        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer border border-slate-800 group"
          title="Imprimer l'Affiche Magasin (A4 / A5)"
        >
          <Printer className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
          <span>Imprimer l&apos;affiche</span>
        </button>
      </div>

      {/* Main 2-Column Layout: Left = Poster Preview, Right = Actions & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Flyer Preview */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full text-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aperçu de l&apos;affiche officielle
            </span>
          </div>

          <div
            id="printable-qr-flyer"
            ref={printableRef}
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 text-center shadow-md space-y-4"
          >
            {/* Header Brand */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-200 p-1 flex items-center justify-center mb-2 overflow-hidden shadow-xs">
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
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider mt-1.5">
                <Sparkles className="w-3 h-3" />
                Programme Fidélité Magasin
              </div>
            </div>

            {/* Title & Call to Action */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                Créez votre compte fidélité en 30 secondes !
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Scannez ce code avec l&apos;appareil photo de votre smartphone pour commencer à cumuler vos points.
              </p>
            </div>

            {/* Crisp QR Code Container */}
            <div className="flex justify-center my-2">
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-sm inline-block">
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
              </div>
            </div>

            {/* Perks: Cumul de points & Promos exclusives */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-slate-700">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">Cumul de points</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">À chaque passage en caisse</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm font-extrabold text-rose-600">Promos exclusives</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Réception d&apos;offres réservées</div>
              </div>
            </div>

            {/* Store Address & URL Footer */}
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 space-y-0.5">
              <div className="font-semibold text-slate-800">
                205 Avenue Antoine de Saint-Exupéry, 62100 Calais
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {publicInviteUrl}
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
              Actions d&apos;impression &amp; Téléchargement
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Imprimez directement l&apos;affiche au format A4 ou téléchargez les fichiers haute résolution pour vos supports de communication :
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
              Ce lien permanent permet à tout client d&apos;accéder à la page de bienvenue du club fidélité et de créer son compte en ligne :
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
