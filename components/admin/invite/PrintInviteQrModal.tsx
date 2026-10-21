"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  Printer,
  Copy,
  Check,
  Sparkles,
  QrCode,
  FileImage,
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
import { QR_COLORS } from "./qr-colors";
import { getSiteUrl } from "@/lib/utils/app-url";

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

  const finalUrl = inviteUrl || `${getSiteUrl()}/invite`;

  useEffect(() => {
    if (isOpen && finalUrl) {
      QRCode.toDataURL(finalUrl, {
        width: 800,
        margin: 2,
        color: QR_COLORS,
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error("Failed to generate QR Code:", err);
          toast.error("Impossible de générer le QR Code.");
        });
    }
  }, [isOpen, finalUrl]);

  // 1. Impression haute définition format A4 / A5 (ou Enregistrer au format PDF)
  const handlePrint = async () => {
    try {
      toast.info("Préparation de l'affiche pour impression...");
      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(finalUrl, {
          width: 800,
          margin: 2,
          color: QR_COLORS,
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(activeQr);
      }

      await printFidelityFlyer(activeQr, finalUrl);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Erreur lors de la préparation de l'impression.");
    }
  };

  // 2. Download Canvas PNG HD
  const handleDownloadWholeFlyer = async () => {
    setIsExporting(true);
    try {
      toast.info("Génération de l'affiche marketing HD...");

      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(finalUrl, {
          width: 800,
          margin: 2,
          color: QR_COLORS,
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(activeQr);
      }

      const canvas = document.createElement("canvas");
      await drawFidelityFlyerOnCanvas(canvas, activeQr, finalUrl, {
        storeName: "Super Market",
        storeAddress: "205 avenue Antoine saint exupery",
        siteUrl: "Supermarketcalais.com",
      });

      await downloadCanvasAsPng(canvas, "affiche-fidelite-supermarket-calais.png");
      toast.success("Affiche complète téléchargée avec succès (PNG HD) !");
    } catch (err) {
      console.error("Flyer export error:", err);
      toast.error("Erreur lors de la création de l'image de l'affiche.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadQrOnly = async () => {
    try {
      let activeQr = qrDataUrl;
      if (!activeQr) {
        activeQr = await QRCode.toDataURL(finalUrl, {
          width: 800,
          margin: 2,
          color: QR_COLORS,
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien copié dans le presse-papiers !");
  };

  return (
    <>
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
            border: 2px solid #e2e8f0 !important;
            border-radius: 28px !important;
            box-shadow: none !important;
            max-width: 160mm !important;
            width: 100% !important;
            margin: 10mm auto !important;
            padding: 28px 24px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: linear-gradient(180deg, #fffdfa 0%, #ffffff 50%, #fff1f2 100%) !important;
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
          <p className="text-xs text-text-muted text-center no-print -mt-1">
            Imprimez cette affiche pour vos comptoirs de caisse ou téléchargez l&apos;image pour vos communications.
          </p>

          {/* THE ENHANCED ALLURING POSTER (Recreated from template -fidility-card.jpeg) */}
          <FidelityPoster
            ref={printableRef}
            qrDataUrl={qrDataUrl}
            finalUrl={finalUrl}
            storeName="Super Market"
            storeAddress="205 avenue Antoine saint exupery"
            siteUrl="Supermarketcalais.com"
          />

          {/* Action Buttons (Excluded from print) */}
          <div className="space-y-2.5 pt-1 no-print">
            <Button
              type="button"
              onClick={handlePrint}
              className="w-full h-11 rounded-xl bg-text hover:bg-text/90 text-background font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Imprimer l&apos;affiche (Format A4 / A5)</span>
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isExporting}
                onClick={handleDownloadWholeFlyer}
                className="h-10 px-2 rounded-xl border-border hover:border-border-hover hover:bg-surface-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-text hover:text-text"
              >
                <FileImage className="w-3.5 h-3.5 text-danger-text shrink-0" />
                <span className="truncate">Affiche PNG HD</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadQrOnly}
                className="h-10 px-2 rounded-xl border-border hover:border-border-hover hover:bg-surface-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-text hover:text-text"
              >
                <QrCode className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="truncate">QR Code seul</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 px-2 rounded-xl border-border hover:border-border-hover hover:bg-surface-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-text hover:text-text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success-text shrink-0" /> : <Copy className="w-3.5 h-3.5 text-text-muted shrink-0" />}
                <span className="truncate">{copied ? "Copié !" : "Copier le lien"}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
