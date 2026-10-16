"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Printer, Download, Copy, Check, Sparkles, QrCode, FileImage } from "lucide-react";

interface PrintInviteQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteUrl?: string;
}

export function PrintInviteQrModal({
  isOpen,
  onClose,
  inviteUrl,
}: PrintInviteQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const finalUrl =
    inviteUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/invite`
      : "https://supermarket-calais.fr/invite");

  useEffect(() => {
    if (isOpen && finalUrl) {
      QRCode.toDataURL(finalUrl, {
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
  }, [isOpen, finalUrl]);

  const handlePrint = () => {
    const flyerElement = printableRef.current || document.getElementById("printable-qr-flyer");
    if (!flyerElement) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe for printing exclusively the flyer
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

    // Clone all stylesheets and style blocks from the host document
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

      // Safety timeout in case an image hangs
      setTimeout(() => {
        if (!isExecuted) {
          isExecuted = true;
          executePrint();
        }
      }, 1000);
    }
  };

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

      // Draw rounded rectangle helper
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

      // Frame around QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      drawRoundRect(ctx, 310, 520, 580, 580, 32);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.drawImage(qrImg, 330, 540, 540, 540);

      // 8. Perks (2 Cards)
      // Left Card: Cumul de points
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

      // Right Card: Promos exclusives
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
      ctx.fillText(finalUrl, 600, 1465);

      // Trigger download
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien copié dans le presse-papiers !");
  };

  return (
    <>
      {/* Global CSS to cleanly isolate printable flyer if window.print() or Ctrl+P is triggered */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 10mm;
          }
          html, body {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Completely hide any top-level layout element that does not contain the flyer */
          body > *:not(:has(#printable-qr-flyer)) {
            display: none !important;
          }
          [data-slot="dialog-overlay"],
          [data-slot="dialog-close"],
          [data-slot="dialog-header"],
          .no-print {
            display: none !important;
          }
          [data-slot="dialog-content"] {
            position: static !important;
            transform: none !important;
            max-width: 100% !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: transparent !important;
          }
          #printable-qr-flyer {
            display: block !important;
            visibility: visible !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 24px !important;
            box-shadow: none !important;
            max-width: 160mm !important;
            width: 100% !important;
            margin: 15mm auto !important;
            padding: 28px 24px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Affiche Magasin & QR Code d'invitation"
        icon="🖨️"
        maxWidth="lg"
      >
        <div className="p-4 sm:p-6 space-y-5">
          {/* Top helper text */}
          <p className="text-xs text-slate-500 text-center no-print -mt-1">
            Imprimez cette affiche pour vos comptoirs de caisse ou téléchargez l&apos;image pour vos communications.
          </p>

          {/* Printable Flyer Preview Container */}
          <div
            id="printable-qr-flyer"
            ref={printableRef}
            className="w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 text-center shadow-xs space-y-4"
          >
            {/* Header Brand */}
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 p-1 flex items-center justify-center mb-1.5 overflow-hidden shadow-xs">
                <Image
                  src="/logo-hq.png"
                  alt="SuperMarket Logo"
                  width={56}
                  height={56}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                Super Market Calais
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1">
                <Sparkles className="w-3 h-3" />
                Programme Fidélité Magasin
              </div>
            </div>

            {/* Title & Call to Action */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                Créez votre compte fidélité en 30 secondes !
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 max-w-xs mx-auto">
                Scannez ce code avec l&apos;appareil photo de votre smartphone pour commencer à cumuler vos points.
              </p>
            </div>

            {/* Crisp QR Code Container */}
            <div className="flex justify-center my-1">
              <div className="p-2.5 sm:p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-xs inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Code QR d'invitation"
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain mx-auto block"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center text-slate-400 text-xs font-mono">
                    Génération du code...
                  </div>
                )}
              </div>
            </div>

            {/* Perks: Cumul de points & Promos exclusives */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-slate-700">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">Cumul de points</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">À chaque passage en caisse</div>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col items-center text-center">
                <div className="text-xs sm:text-sm font-extrabold text-rose-600">Promos exclusives</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Réception d&apos;offres réservées</div>
              </div>
            </div>

            {/* Store Address & URL Footer */}
            <div className="pt-2 text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-100 space-y-0.5">
              <div className="font-semibold text-slate-800">
                205 Avenue Antoine de Saint-Exupéry, 62100 Calais
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {finalUrl}
              </div>
            </div>
          </div>

          {/* Action Buttons (Excluded from print) */}
          <div className="space-y-2.5 pt-1 no-print">
            {/* Primary Action: Print */}
            <Button
              type="button"
              onClick={handlePrint}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Imprimer l&apos;affiche (Format A4 / A5)</span>
            </Button>

            {/* Secondary Actions: Download Options & Link Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isExporting}
                onClick={handleDownloadWholeFlyer}
                className="h-10 px-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 hover:text-slate-900"
              >
                <FileImage className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">Télécharger l&apos;affiche</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadQrOnly}
                className="h-10 px-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 hover:text-slate-900"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">QR Code seul (PNG)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 px-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-700 hover:text-slate-900"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                <span className="truncate">{copied ? "Lien copié !" : "Copier le lien"}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
