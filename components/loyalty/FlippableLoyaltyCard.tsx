"use client";

import React, { useState } from "react";
import Image from "next/image";
import { QrCode, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalLoyaltyCard } from "./DigitalLoyaltyCard";
import { useStoreCardQr } from "./useStoreCardQr";

type FlippableLoyaltyCardProps = React.ComponentProps<typeof DigitalLoyaltyCard> & {
  customerId: string;
};

/**
 * Store card that flips over to reveal its QR code, scanned at the checkout
 * to find the account. Both faces share one grid cell so the card keeps the front's height.
 */
export function FlippableLoyaltyCard({ customerId, ...cardProps }: FlippableLoyaltyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const qrDataUrl = useStoreCardQr(customerId, isFlipped);

  return (
    <div className="space-y-4">
      <div className="perspective-[1200px]">
        <div
          className={`grid transform-3d transition-transform duration-700 ease-in-out motion-reduce:transition-none ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="[grid-area:1/1] backface-hidden" aria-hidden={isFlipped} inert={isFlipped}>
            <DigitalLoyaltyCard {...cardProps} userId={customerId} />
          </div>

          {/* Back. Fixed light background: the code needs dark-on-light contrast whatever the theme */}
          <div
            className="scheme-light [grid-area:1/1] backface-hidden rotate-y-180 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col items-center justify-center gap-2"
            aria-hidden={!isFlipped}
            inert={!isFlipped}
          >
            <div className="flex-1 min-h-0 aspect-square max-w-full">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="QR code de la carte du magasin"
                  width={320}
                  height={320}
                  unoptimized
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full w-full rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] animate-pulse" />
              )}
            </div>
            <p className="text-sm font-bold text-[var(--color-text)] text-center truncate max-w-full">
              {cardProps.fullName}
            </p>
          </div>
        </div>
      </div>

      <Button variant="primary" className="w-full" onClick={() => setIsFlipped((v) => !v)}>
        {isFlipped ? (
          <RotateCcw className="w-4 h-4" aria-hidden />
        ) : (
          <QrCode className="w-4 h-4" aria-hidden />
        )}
        {isFlipped ? "Retourner la carte" : "Présenter ma carte en caisse"}
      </Button>
    </div>
  );
}
