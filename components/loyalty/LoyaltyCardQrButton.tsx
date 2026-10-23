"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { encodeLoyaltyCardCode } from "@/lib/loyalty/card-code";
import { QR_COLORS } from "@/components/admin/invite/qr-colors";

interface LoyaltyCardQrButtonProps {
  customerId: string;
  fullName: string;
}

/** Opens the customer's loyalty card QR code, scanned at the checkout to find the account. */
export function LoyaltyCardQrButton({ customerId, fullName }: LoyaltyCardQrButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!isOpen || qrDataUrl) return;
    QRCode.toDataURL(encodeLoyaltyCardCode(customerId), {
      width: 640,
      margin: 2,
      color: QR_COLORS,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Failed to generate loyalty card QR code:", err));
  }, [isOpen, qrDataUrl, customerId]);

  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setIsOpen(true)}>
        <QrCode className="w-4 h-4" aria-hidden />
        Afficher ma carte en caisse
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Ma carte de fidélité"
        description="Présentez ce code au caissier."
        maxWidth="sm"
      >
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Fixed light background: the code needs dark-on-light contrast whatever the theme */}
          <div className="scheme-light w-full max-w-[320px] aspect-square rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex items-center justify-center">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="QR code de la carte de fidélité"
                width={320}
                height={320}
                unoptimized
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] animate-pulse" />
            )}
          </div>
          <p className="text-base font-bold text-[var(--color-text)] text-center">{fullName}</p>
        </div>
      </Modal>
    </>
  );
}
